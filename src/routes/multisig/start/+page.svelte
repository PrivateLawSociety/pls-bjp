<script lang="ts">
	import { createBitcoinMultisig, startTxSpendingFromMultisig } from 'pls-bitcoin';
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import type { Contract } from 'pls-full';
	import { type PsbtMetadata, SpendRequestEvent, type SpendRequestPayload } from '../shared';
	import { broadcastToNostr, nostrAuth } from '$lib/nostr';
	import { onMount } from 'svelte';
	import { hashFromFile } from '$lib/utils';
	import { createMempoolApi, type UTXO } from '$lib/mempool';
	import { ECPair, getNetworkByName } from '$lib/bitcoin';
	import { contractDataFileStore } from '$lib/stores';
	import { createLiquidMultisig, getUnblindedUtxoValue, startSpendFromLiquidMultisig } from 'pls-liquid';
	import DropContract from '$lib/components/DropContract.svelte';

	let utxos: (UTXO & { hex?: string })[] | null = null;

	let contractData: Contract | null = null;
	let contractFile: File | null = null;

	let generatedPSBTsMetadata: PsbtMetadata[] | null = null;

	let addressIdCounter = 0;

	let addresses: {
		id: number;
		address: string;
		value: number;
	}[] = [
		{
			id: addressIdCounter++,
			address: '',
			value: 0
		}
	];

	let timelockDays: number | undefined = undefined;

	let replacingByFee = false;

	$: network = contractData ? getNetworkByName(contractData.collateral.network) : null;
	$: mempool = network ? createMempoolApi(network) : null;

	$: if ($contractDataFileStore) onContractDataFileSelected($contractDataFileStore);

	$: availableBalance = utxos?.reduce((acc, utxo) => acc + utxo.value, 0) ?? 0;

	$: feeAmount = availableBalance - addresses.reduce((acc, cv) => acc + cv.value, 0);

	function addAddress() {
		addresses = [...addresses, { id: addressIdCounter++, address: '', value: 0 }];
	}

	function removeAddress(index: number) {
		if (addresses.length > 1) {
			addresses = addresses.filter((_, i) => i !== index);
		}
	}

	onMount(() => {
		nostrAuth.tryLogin();
	});

	async function onContractDataFileSelected(file: File) {
		contractData = tryParseFinishedContract(await file.text());

		onContractSelected();
	}

	async function onContractSelected() {
		if (!contractData || !mempool) return;

		utxos = await mempool.getAddressUtxos(contractData.collateral.multisigAddress);

		if (getNetworkByName(contractData.collateral.network).isLiquid && utxos) {
			const txHexes = await Promise.all(
				utxos.map((utxo) => mempool.getTransactionHexFromId(utxo.txid))
			);

			utxos = utxos.reduce((acc, utxo, i) => {
				const hex = txHexes[i];

				if (hex) {
					const value = getUnblindedUtxoValue(
						{
							...utxo,
							hex: hex!
						},
						i
					);

					if (value)
						acc.push({
							...utxo,
							hex,
							value
						});
				}

				return acc;
			}, [] as (UTXO & { hex: string; value: number })[]);
		} else {
			const unconfirmedTxs = await mempool.getAddressUnconfirmedTxs(
				contractData.collateral.multisigAddress
			);

			if (!unconfirmedTxs) return;

			const unconfirmedUtxos: UTXO[] = [];

			const address = contractData.collateral.multisigAddress;

			unconfirmedTxs.forEach((tx) =>
				tx.vin
					.filter((vin) => vin.prevout.scriptpubkey_address === address)
					.forEach((vin) => {
						replacingByFee = true;
						return unconfirmedUtxos.push({
							txid: vin.txid,
							value: vin.prevout.value,
							vout: vin.vout
						});
					})
			);

			utxos = [...(utxos ?? []), ...unconfirmedUtxos];
		}
	}

	async function handleStartSpend() {
		if (!contractData || !utxos) return alert('UTXOs haven\'t loaded yet');

		const signer = nostrAuth.getSigner(contractData.collateral.network);

		if (!signer) return;

		const pubkey = $nostrAuth?.pubkey;

		const { network, isLiquid } = getNetworkByName(contractData.collateral.network);

		if (isLiquid) {
			const { hashTree, multisigScripts } = createLiquidMultisig(
				contractData.collateral.pubkeys.clients,
				contractData.collateral.pubkeys.arbitrators,
				contractData.collateral.arbitratorsQuorum,
				network
			);

			// const unixNow = Math.floor(Date.now() / 1000);
			// const oneDayInSeconds = 60 * 60 * 24;

			const possibleScripts = multisigScripts.filter(({ combination }) =>
				combination.some((ecpair) => ecpair === pubkey)
			);

			generatedPSBTsMetadata = [];

			for (const script of possibleScripts) {
				const redeemOutput = script.leaf.output.toString('hex');

				const psbt = await startSpendFromLiquidMultisig(
					hashTree,
					redeemOutput,
					utxos.map((utxo) => ({
						...utxo,
						hex: utxo.hex!
					})),
					network,
					signer,
					addresses.filter(({ address }) => address.trim() !== '')
					// timelockDays ? unixNow + oneDayInSeconds * timelockDays : undefined
				);
				if (!psbt) return alert('couldn\'t generate PSETs');

				generatedPSBTsMetadata = [
					...generatedPSBTsMetadata,
					{
						redeemOutput,
						psbtHex: psbt.toBuffer().toString('hex'),
						pubkeys: script.combination
					}
				];
			}
		} else {
			const { multisig, multisigScripts } = createBitcoinMultisig(
				contractData.collateral.pubkeys.clients.map((pubkey) =>
					ECPair.fromPublicKey(Buffer.from('02' + pubkey, 'hex'), { network: network })
				),
				contractData.collateral.pubkeys.arbitrators.map((pubkey) =>
					ECPair.fromPublicKey(Buffer.from('02' + pubkey, 'hex'), { network: network })
				),
				contractData.collateral.arbitratorsQuorum,
				network
			);

			const possibleScripts = multisigScripts.filter(({ combination }) =>
				combination.some((ecpair) => ecpair.publicKey.toString('hex') === '02' + pubkey)
			);

			generatedPSBTsMetadata = [];

			for (const script of possibleScripts) {
				const redeemOutput = script.leaf.output.toString('hex');

				const unixNow = Math.floor(Date.now() / 1000);
				const oneDayInSeconds = 60 * 60 * 24;

				const psbt = await startTxSpendingFromMultisig(
					multisig,
					redeemOutput,
					signer,
					network,
					addresses.filter(({ address }) => address.trim() !== ''),
					utxos,
					timelockDays ? unixNow + oneDayInSeconds * timelockDays : undefined
				);

				generatedPSBTsMetadata = [
					...generatedPSBTsMetadata,
					{
						redeemOutput,
						psbtHex: psbt.toHex(),
						pubkeys: script.combination.map((ecpair) => ecpair.publicKey.toString('hex'))
					}
				];
			}
		}
	}

	function copyToClipboard() {
		if (!generatedPSBTsMetadata) return;

		navigator.clipboard.writeText(JSON.stringify(generatedPSBTsMetadata));
		setTimeout(() => alert('Copied to clipboard'), 0);
	}

	async function sendViaNostr() {
		if (!generatedPSBTsMetadata) return;
		if (!contractFile) return;

		const payload = JSON.stringify({
			psbtsMetadata: generatedPSBTsMetadata
		} as SpendRequestPayload);

		const event = await nostrAuth.makeEvent(SpendRequestEvent, payload, [
			['h', (await hashFromFile(contractFile)).toString('hex')]
		]);

		broadcastToNostr(event);
	}
</script>

<div class="flex flex-col items-center justify-center min-h-screen w-full p-4">
	{#if generatedPSBTsMetadata}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full flex flex-col items-center gap-6">
			<h1 class="text-3xl font-bold text-pls-blue-100">Spending initiated</h1>
			<p class="text-gray-700 text-center">Send this to another party so that they can complete the spending:</p>
			<div class="flex gap-4 flex-wrap justify-center">
				<button
					on:click={copyToClipboard}
					class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-6 py-3 text-lg transition-colors"
				>
					Copy
				</button>
				<button
					on:click={sendViaNostr}
					class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-6 py-3 text-lg transition-colors"
				>
					Send via nostr
				</button>
			</div>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full">
			<h1 class="text-3xl font-bold text-pls-blue-100 text-center mb-6">Start withdraw from contract</h1>

			{#if contractData}
				<div class="space-y-6">
					<div class="flex gap-4 items-center justify-center flex-wrap">
						<p class="text-xl text-gray-700 font-semibold">
							Available balance: {availableBalance === undefined
							? 'Loading...'
							: `${availableBalance} sats`}
						</p>
						{#if replacingByFee}
							<div
								class="px-3 py-2 rounded-lg text-white bg-green-600 font-bold text-sm"
								title="This transaction is replacing a previous one"
							>
								RBF
							</div>
						{/if}
					</div>

					{#if !getNetworkByName(contractData.collateral.network).isLiquid}
						<div class="flex justify-center">
							{#if timelockDays === undefined}
								<button
									on:click={() => (timelockDays = 90)}
									class="bg-gray-100 hover:bg-gray-200 text-pls-blue-100 rounded px-4 py-2 transition-colors border border-pls-blue-100"
								>
									Add timelock
								</button>
							{:else}
								<div class="bg-gray-50 rounded-lg p-4 border border-gray-200 w-full max-w-md">
									<label class="block text-sm font-semibold text-gray-700 mb-2">
										Days until the timelock's unlocked
									</label>
									<input
										type="number"
										bind:value={timelockDays}
										class="w-full px-3 py-2 border border-gray-300 rounded text-pls-blue-100 focus:outline-none focus:ring-2 focus:ring-pls-blue-100"
									/>
								</div>
							{/if}
						</div>
					{/if}

					<div class="space-y-4">
						<div class="flex justify-between items-center">
							<h2 class="text-xl font-semibold text-pls-blue-100">Receiving Addresses</h2>
							<button
								on:click={addAddress}
								class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
								title="Add new address"
							>
								+
							</button>
						</div>

						<div class="max-h-96 overflow-y-auto space-y-4 pr-2">
							{#each addresses as addr, i (addr.id)}
								<div class="bg-gray-50 rounded-lg p-4 border border-2 border-pls-blue-50 relative">
									<div class="flex flex-col gap-3">
										<div class="flex justify-between items-center mb-2">
											<span class="text-sm font-semibold text-gray-600">Address #{i + 1}</span>
											{#if addresses.length > 1}
												<button
													on:click={() => removeAddress(i)}
													class="text-red-500 hover:text-red-700 transition-colors font-bold text-xl"
													title="Remove address"
												>
													×
												</button>
											{/if}
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">
												Receiving address
											</label>
											<input
												type="text"
												bind:value={addr.address}
												class="w-full px-3 py-2 border border-gray-300 rounded text-pls-blue-100 focus:outline-none focus:ring-2 focus:ring-pls-blue-100"
												placeholder="Enter Bitcoin address"
											/>
										</div>
										<div>
											<label class="block text-sm font-medium text-gray-700 mb-1">
												Amount (sats)
											</label>
											<input
												type="number"
												bind:value={addr.value}
												class="w-full px-3 py-2 border border-gray-300 rounded text-pls-blue-100 focus:outline-none focus:ring-2 focus:ring-pls-blue-100"
												placeholder="0"
											/>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<p class="text-center text-gray-700">
							<span class="font-semibold">Network fee:</span> {feeAmount} sats
						</p>
					</div>

					<div class="flex justify-center">
						<button
							on:click={handleStartSpend}
							class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-8 py-3 text-lg font-semibold transition-colors"
						>
							Start spend
						</button>
					</div>
				</div>
			{:else}
				<DropContract bind:file={contractFile} bind:contractData />
			{/if}
		</div>
	{/if}
</div>
