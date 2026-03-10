<script lang="ts">
	import { Psbt } from 'bitcoinjs-lib';
	import { type PsbtMetadata, SpendRequestEvent, type SpendRequestPayload } from '../shared';
	import { broadcastToNostr, nostrAuth, relayList, relayPool } from '$lib/nostr';
	import { onMount } from 'svelte';
	import { formatDateTime, hashFromFile } from '$lib/utils';
	import { createMempoolApi } from '$lib/mempool';
	import { contractDataFileStore } from '$lib/stores';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import { address, bip341, Pset } from 'liquidjs-lib';
	import {
		createLiquidMultisig,
		finalizeTxSpendingFromLiquidMultisig,
		getTapscriptSigsOrdered,
		signTaprootTransaction
	} from 'pls-liquid';
	import type { Contract } from 'pls-full';
	import DropDocument from '$lib/components/DropDocument.svelte';
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import { getNetworkByName } from '$lib/bitcoin';

	let psbtsMetadataStringified = '';

	export let psbtsMetadata: PsbtMetadata[] | null = null;

	let generatedPSBTsMetadata: PsbtMetadata[] | null = null;
	let generatedTransactionHex: string | null = null;

	let contractData: Contract | null = null;
	let contractFile: File | null;
	let psbtFiles: FileList | null;

	$: network = contractData ? getNetworkByName(contractData.collateral.network) : null;
	$: mempool = network ? createMempoolApi(network) : null;

	$: {
		const file = psbtFiles?.item(0);

		if (file) file.text().then((text) => (psbtsMetadataStringified = text));
	}

	$: if (contractData) onContractSelected();

	$: userShownData = getUserShownData(psbtsMetadata, contractData);

	$: if ($contractDataFileStore) onContractDataFileSelected($contractDataFileStore);

	async function onContractDataFileSelected(file: File) {
		contractData = tryParseFinishedContract(await file.text());
	}

	function getUserShownData(psbtsMetadata: PsbtMetadata[] | null, contractData: Contract | null) {
		if (!psbtsMetadata || !contractData) return null;

		// TODO: checck if this works
		const { isLiquid, network } = getNetworkByName(contractData.collateral.network);

		if (isLiquid) {
			const pset = Pset.fromBuffer(Buffer.from(psbtsMetadata[0].psbtHex, 'hex'));

			return {
				outputs: pset.outputs
					.filter(({ script }) => script?.length !== 0)
					.map(({ value, script, blindingPubkey }) => {
						const addresss = address.fromOutputScript(script!, network);

						return {
							value,
							address: address.toConfidential(addresss, blindingPubkey!)
						};
					}),
				locktime: pset.locktime()
			};
		} else {
			const psbt = Psbt.fromHex(psbtsMetadata[0].psbtHex, { network: network });

			return {
				outputs: psbt.txOutputs,
				locktime: psbt.locktime
			};
		}
	}

	let transactionLocktime: number | null = null;

	$: {
		try {
			psbtsMetadata = JSON.parse(psbtsMetadataStringified) as PsbtMetadata[];

			if (!areAllPsbtsEquivalent(psbtsMetadata)) {
				psbtsMetadata = null;
				alert('PSBTs are not equivalent! This may either be a bug or a malicious actor');
			}
		} catch (error) {
			psbtsMetadata = null;
		}
	}

	onMount(() => {
		nostrAuth.tryLogin();
	});

	async function onContractSelected() {
		if (!contractFile) return;
		if (!$nostrAuth?.pubkey) return;

		relayPool.subscribeMany(
			relayList,
			[
				{
					kinds: [SpendRequestEvent],
					'#h': [(await hashFromFile(contractFile)).toString('hex')]
				}
			],
			{
				onevent(e) {
					const { psbtsMetadata } = JSON.parse(e.content) as SpendRequestPayload;

					psbtsMetadataStringified = JSON.stringify(psbtsMetadata);
				}
			}
		);
	}

	// for security reasons, check if all PSBTs are equivalent before signing
	function areAllPsbtsEquivalent(psbtsMetadata: PsbtMetadata[]) {
		if (psbtsMetadata.length === 1) return true;
		if (contractData === null) return false;

		const { isLiquid } = getNetworkByName(contractData.collateral.network);

		if (isLiquid) {
			const firstPsetMetadata = psbtsMetadata[0];
			const firstPset = Pset.fromBuffer(Buffer.from(firstPsetMetadata.psbtHex, 'hex'));

			return psbtsMetadata
				.map(({ psbtHex }) => Pset.fromBuffer(Buffer.from(psbtHex, 'hex')))
				.every((pset) =>
					pset.outputs.every((output, i) => {
						return (
							output.script?.toString('hex') == firstPset.outputs[i].script?.toString('hex') &&
							output.value == firstPset.outputs[i].value
						);
					})
				);
		} else {
			const firstPsbtMetadata = psbtsMetadata[0];
			const firstPsbt = Psbt.fromHex(firstPsbtMetadata.psbtHex);

			return psbtsMetadata.every(({ psbtHex }) =>
				Psbt.fromHex(psbtHex).txOutputs.every(
					(output, i) =>
						output.address === firstPsbt.txOutputs[i].address &&
						output.value === firstPsbt.txOutputs[i].value
				)
			);
		}
	}

	async function handleApproveTransaction() {
		if (!psbtsMetadata || !contractData) return;

		const pubkey = $nostrAuth?.pubkey;

		if (!pubkey) return;

		const {
			isLiquid,
			network,
			name: networkName
		} = getNetworkByName(contractData?.collateral.network);

		const signer = nostrAuth.getSigner(networkName);

		if (!signer) return;

		if (isLiquid) {
			const { multisigScripts } = createLiquidMultisig(
				contractData.collateral.pubkeys.clients,
				contractData.collateral.pubkeys.arbitrators,
				contractData.collateral.arbitratorsQuorum,
				network
			);

			generatedPSBTsMetadata = await Promise.all(
				psbtsMetadata
					.filter(({ pubkeys }) => pubkeys.includes(pubkey))
					.map(async (metadata) => {
						if (!isLiquid) throw new Error('Network is not liquid');

						const redeemOutput = multisigScripts
							.find(({ combination }) =>
								combination.sort().every((pubkey, i) => pubkey === metadata.pubkeys.sort()[i])
							)
							?.leaf.output.toString('hex');

						if (!redeemOutput) throw new Error('No redeem output');

						const pset = Pset.fromBuffer(Buffer.from(metadata.psbtHex, 'hex'));

						const leafHash = bip341.tapLeafHash({
							scriptHex: redeemOutput
						});

						await signTaprootTransaction(pset, signer, leafHash, network);

						return {
							...metadata,
							psbtHex: pset.toBuffer().toString('hex')
						};
					})
			);

			if (generatedPSBTsMetadata.length === 1) {
				const pset = Pset.fromBuffer(Buffer.from(generatedPSBTsMetadata[0].psbtHex, 'hex'));

				const { clientSigs, arbitratorSigs } = getTapscriptSigsOrdered(
					pset,
					contractData.collateral.pubkeys.clients,
					contractData.collateral.pubkeys.arbitrators
				);

				const clientSigAmount = clientSigs.reduce((acc, sig) => (sig ? acc + 1 : acc), 0);
				const arbitratorSigAmount = arbitratorSigs.reduce((acc, sig) => (sig ? acc + 1 : acc), 0);

				if (
					clientSigAmount == 2 ||
					(clientSigAmount == 1 && arbitratorSigAmount >= contractData.collateral.arbitratorsQuorum)
				) {
					const tx = finalizeTxSpendingFromLiquidMultisig(pset, clientSigs, arbitratorSigs);

					generatedTransactionHex = tx.toHex();
				}
			}
		} else {
			generatedPSBTsMetadata = await Promise.all(
				psbtsMetadata
					.filter(({ pubkeys }) => pubkeys.includes('02' + pubkey))
					.map(async (metadata) => {
						const psbt = Psbt.fromHex(metadata.psbtHex, { network: network });

						await psbt.signAllInputsAsync(signer);

						return {
							...metadata,
							psbtHex: psbt.toHex()
						};
					})
			);

			// There's only one spending possibility left, so the tx can be finished
			if (generatedPSBTsMetadata.length === 1) {
				const psbt = Psbt.fromHex(generatedPSBTsMetadata[0].psbtHex, { network: network });

				psbt.finalizeAllInputs();

				const tx = psbt.extractTransaction();

				if (tx.locktime !== 0) transactionLocktime = tx.locktime;

				generatedTransactionHex = tx.toHex();
			}
		}
	}

	function copyTransactionToClipboard() {
		if (!generatedTransactionHex) return;

		navigator.clipboard.writeText(generatedTransactionHex);
		setTimeout(() => alert('Copied to clipboard'), 0);
	}

	function copyPsbtsToClipboard() {
		if (!generatedPSBTsMetadata) return;

		navigator.clipboard.writeText(JSON.stringify(generatedPSBTsMetadata));
		setTimeout(() => alert('Copied to clipboard'), 0);
	}

	async function publish() {
		if (!generatedTransactionHex || !mempool) return;

		mempool.publishTransaction(generatedTransactionHex);
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
	{#if !generatedPSBTsMetadata && !psbtsMetadata}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full flex flex-col items-center gap-6">
			<h1 class="text-3xl font-bold text-pls-blue-100">Continue spend from multisig</h1>

			<div class="w-full space-y-4">
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">PSBT hex</label>
					<textarea
						bind:value={psbtsMetadataStringified}
						class="w-full px-3 py-2 border border-gray-300 rounded text-pls-blue-100 focus:outline-none focus:ring-2 focus:ring-pls-blue-100 min-h-[100px]"
						placeholder="Paste PSBT hex here"
					></textarea>
				</div>

				<div class="text-center text-gray-500 font-semibold">or</div>

				<FileDrop dropText={'Drop PSBT here'} bind:files={psbtFiles} />

				{#if !contractFile && !$contractDataFileStore}
					<div class="text-center text-gray-500 font-semibold">or from nostr:</div>
					<DropDocument bind:file={contractFile} />
				{:else}
					<div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
						<p class="text-center text-gray-700 font-semibold">Waiting for a nostr event...</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if generatedTransactionHex}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full flex flex-col items-center gap-6">
			<h1 class="text-3xl font-bold text-pls-blue-100">Transaction created</h1>
			<p class="text-gray-700 text-center">Your transaction is ready to be published to the network</p>
			<!-- TODO: don't show this button if transaction has timelock -->
			<div class="flex gap-4 flex-wrap justify-center">
				<button
					on:click={publish}
					class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-6 py-3 text-lg transition-colors"
				>
					Publish
				</button>
				<button
					on:click={copyTransactionToClipboard}
					class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-6 py-3 text-lg transition-colors"
				>
					Copy
				</button>
			</div>
		</div>
	{:else if generatedPSBTsMetadata}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full flex flex-col items-center gap-6">
			<h1 class="text-3xl font-bold text-pls-blue-100">PSBT created</h1>
			<p class="text-gray-700 text-center">Send this to another party so that they can continue the spending</p>
			<div class="flex gap-4 flex-wrap justify-center">
				<button
					on:click={copyPsbtsToClipboard}
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
	{:else if userShownData}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
			<h1 class="text-3xl font-bold text-pls-blue-100 text-center mb-6">Review transaction</h1>

			<div class="space-y-4 mb-6">
				<h2 class="text-xl font-semibold text-gray-700">Outputs:</h2>
				{#each userShownData.outputs as output}
					<div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
						<p class="text-sm text-gray-600 font-semibold mb-1">Address:</p>
						<p class="break-all text-pls-blue-100 font-mono text-sm mb-3">{output.address}</p>
						<p class="text-sm text-gray-600 font-semibold mb-1">Amount:</p>
						<p class="text-lg font-bold text-gray-700">{output.value} sats</p>
					</div>
				{/each}

				{#if userShownData.locktime !== 0}
					<div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
						<p class="text-sm text-gray-600 font-semibold mb-1">Timelock:</p>
						<p class="text-gray-700">{formatDateTime(new Date(userShownData.locktime * 1000))}</p>
					</div>
				{/if}
			</div>

			<div class="flex justify-center">
				<button
					on:click={handleApproveTransaction}
					class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-8 py-3 text-lg font-semibold transition-colors"
				>
					Approve transaction
				</button>
			</div>
		</div>
	{:else if psbtsMetadataStringified.length > 0}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center mt-2">
			<p class="text-xl text-red-600 font-semibold">Invalid PSBT</p>
			<p class="text-sm text-gray-500 mt-2">Please check the PSBT data and try again</p>
		</div>
	{/if}
</div>
