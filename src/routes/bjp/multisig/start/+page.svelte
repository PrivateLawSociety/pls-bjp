<script lang="ts">
	import { page } from '$app/state';
	import { createBitcoinMultisig, startTxSpendingFromMultisig } from 'pls-bitcoin';
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import type { Contract } from 'pls-full';
	import { type PsbtMetadata, SpendRequestEvent, type SpendRequestPayload } from '../shared';
	import { broadcastToNostr, getSigner, nostrAuth } from '$lib/nostr';
	import { onMount } from 'svelte';
	import { hashFromFile } from '$lib/utils';
	import { createMempoolApi, type UTXO } from '$lib/mempool';
	import { ECPair, getNetworkByName } from '$lib/bitcoin';
	import { contractDataFileStore } from '$lib/stores';
	import {
		createLiquidMultisig,
		getUnblindedUtxoValue,
		startSpendFromLiquidMultisig
	} from 'pls-liquid';
	import DropContract from '$lib/components/DropContract.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let utxos: (UTXO & { hex?: string })[] | null = null;
	let contractData: Contract | null = null;
	let contractFile: File | null = null;
	let generatedPSBTsMetadata: PsbtMetadata[] | null = null;

	let addressIdCounter = 0;
	let addresses: { id: number; address: string; value: number }[] = [
		{ id: addressIdCounter++, address: '', value: 0 }
	];
	let timelockDays: number | undefined = undefined;
	let replacingByFee = false;

	$: network = contractData ? getNetworkByName(contractData.collateral.network) : null;
	$: mempool = network ? createMempoolApi(network) : null;
	$: if ($contractDataFileStore) onContractDataFileSelected($contractDataFileStore);
	$: availableBalance = utxos?.reduce((acc, utxo) => acc + utxo.value, 0) ?? 0;
	$: feeAmount = availableBalance - addresses.reduce((acc, cv) => acc + cv.value, 0);
	const isPortuguese = page.url.pathname.startsWith('/pt/');

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

			utxos = utxos.reduce(
				(acc, utxo, i) => {
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
				},
				[] as (UTXO & { hex: string; value: number })[]
			);
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
		if (!contractData || !utxos)
			return alert(isPortuguese ? 'UTXOs ainda não carregaram' : "UTXOs haven't loaded yet");

		const signer = getSigner(contractData.collateral.network);
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

			const possibleScripts = multisigScripts.filter(({ combination }: { combination: string[] }) =>
				combination.some((ecpair: string) => ecpair === pubkey)
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
				);
				if (!psbt)
					return alert(
						isPortuguese ? 'não foi possível gerar os PSETs' : "couldn't generate PSETs"
					);

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
				contractData.collateral.pubkeys.clients.map((pubkey: string) =>
					ECPair.fromPublicKey(Buffer.from('02' + pubkey, 'hex'), { network: network })
				),
				contractData.collateral.pubkeys.arbitrators.map((pubkey: string) =>
					ECPair.fromPublicKey(Buffer.from('02' + pubkey, 'hex'), { network: network })
				),
				contractData.collateral.arbitratorsQuorum,
				network
			);

			const possibleScripts = multisigScripts.filter(
				({ combination }: { combination: { publicKey: Buffer }[] }) =>
					combination.some(
						(ecpair: { publicKey: Buffer }) => ecpair.publicKey.toString('hex') === '02' + pubkey
					)
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
						pubkeys: script.combination.map((ecpair: { publicKey: Buffer }) =>
							ecpair.publicKey.toString('hex')
						)
					}
				];
			}
		}
	}

	$: psbtsClipboardValue = generatedPSBTsMetadata ? JSON.stringify(generatedPSBTsMetadata) : '';

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

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8">
	{#if generatedPSBTsMetadata}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Gasto iniciado' : 'Spending initiated'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Envie isto para outra parte para que ela possa concluir o gasto.'
					: 'Send this to another party so that they can complete the spending.'}
			</p>
		</div>

		<Card class="flex flex-col items-center gap-4">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="22"
					height="22"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="20 6 9 17 4 12" />
				</svg>
			</div>
			<div class="flex flex-wrap justify-center gap-3">
				<CopyButton
					value={psbtsClipboardValue}
					variant="primary"
					label={isPortuguese ? 'Copiar PSBT' : 'Copy PSBT'}
				/>
				<Button variant="outline" on:click={sendViaNostr}>
					{isPortuguese ? 'Enviar via Nostr' : 'Send via Nostr'}
				</Button>
			</div>
		</Card>
	{:else}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Iniciar saque' : 'Start withdrawal'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Proponha como a garantia deve ser distribuída.'
					: 'Propose how the collateral should be distributed.'}
			</p>
		</div>

		{#if contractData}
			<Card class="flex flex-col gap-6">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
							{isPortuguese ? 'Saldo disponível' : 'Available balance'}
						</p>
						<p class="mt-1 font-mono text-xl font-bold text-[rgb(var(--text))]">
							{availableBalance === undefined
								? isPortuguese
									? 'Carregando…'
									: 'Loading…'
								: `${availableBalance} sats`}
						</p>
					</div>
					{#if replacingByFee}
						<Badge variant="success" size="md"
							>{isPortuguese ? 'RBF · Substituindo' : 'RBF · Replacing'}</Badge
						>
					{/if}
				</div>

				{#if !getNetworkByName(contractData.collateral.network).isLiquid}
					<div
						class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
					>
						{#if timelockDays === undefined}
							<div class="flex items-center justify-between gap-3">
								<div>
									<p class="text-sm font-semibold text-[rgb(var(--text))]">
										{isPortuguese ? 'Timelock (opcional)' : 'Timelock (optional)'}
									</p>
									<p class="text-xs text-[rgb(var(--text-muted))]">
										{isPortuguese
											? 'Atraso para quando este gasto pode ser transmitido.'
											: 'Delay when this spend can be broadcast.'}
									</p>
								</div>
								<Button size="sm" variant="outline" on:click={() => (timelockDays = 90)}>
									{isPortuguese ? 'Adicionar timelock' : 'Add timelock'}
								</Button>
							</div>
						{:else}
							<label class="flex flex-col gap-2">
								<span class="text-sm font-semibold text-[rgb(var(--text))]"
									>{isPortuguese
										? 'Dias até liberar o timelock'
										: 'Days until timelock unlocks'}</span
								>
								<input
									type="number"
									bind:value={timelockDays}
									class="w-full rounded-xl bg-[rgb(var(--surface))] border border-[rgb(var(--border))] px-4 py-3 text-[rgb(var(--text))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
								/>
							</label>
						{/if}
					</div>
				{/if}

				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<h2
							class="text-sm font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
						>
							{isPortuguese ? 'Endereços de recebimento' : 'Receiving addresses'}
						</h2>
						<button
							on:click={addAddress}
							class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow transition-all hover:brightness-110"
							title={isPortuguese ? 'Adicionar endereço' : 'Add address'}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
						</button>
					</div>

					<div class="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
						{#each addresses as addr, i (addr.id)}
							<div
								class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
							>
								<div class="mb-3 flex items-center justify-between">
									<span
										class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
									>
										{isPortuguese ? `Saída #${i + 1}` : `Output #${i + 1}`}
									</span>
									{#if addresses.length > 1}
										<button
											on:click={() => removeAddress(i)}
											class="inline-flex h-6 w-6 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-500/10"
											title={isPortuguese ? 'Remover endereço' : 'Remove address'}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<line x1="18" y1="6" x2="6" y2="18" />
												<line x1="6" y1="6" x2="18" y2="18" />
											</svg>
										</button>
									{/if}
								</div>
								<div class="flex flex-col gap-3">
									<label class="flex flex-col gap-1">
										<span class="text-xs font-medium text-[rgb(var(--text-muted))]"
											>{isPortuguese ? 'Endereço de recebimento' : 'Receiving address'}</span
										>
										<input
											type="text"
											bind:value={addr.address}
											class="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 font-mono text-sm text-[rgb(var(--text))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
											placeholder="bc1q…"
										/>
									</label>
									<label class="flex flex-col gap-1">
										<span class="text-xs font-medium text-[rgb(var(--text-muted))]"
											>{isPortuguese ? 'Valor (sats)' : 'Amount (sats)'}</span
										>
										<input
											type="number"
											bind:value={addr.value}
											class="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2.5 font-mono text-sm text-[rgb(var(--text))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
											placeholder="0"
										/>
									</label>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div
					class="flex items-center justify-between rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 py-3"
				>
					<span class="text-sm text-[rgb(var(--text-muted))]">
						{isPortuguese ? 'Taxa de rede' : 'Network fee'}
					</span>
					<span class="font-mono text-sm font-bold text-[rgb(var(--text))]">{feeAmount} sats</span>
				</div>

				<Button variant="primary" size="lg" fullWidth on:click={handleStartSpend}>
					{isPortuguese ? 'Iniciar gasto' : 'Start spend'}
				</Button>
			</Card>
		{:else}
			<Card>
				<DropContract bind:file={contractFile} bind:contractData />
			</Card>
		{/if}
	{/if}
</div>
