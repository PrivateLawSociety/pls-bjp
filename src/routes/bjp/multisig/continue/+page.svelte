<script lang="ts">
	import { page } from '$app/state';
	import { Psbt } from 'bitcoinjs-lib';
	import { type PsbtMetadata, SpendRequestEvent, type SpendRequestPayload } from '../shared';
	import { broadcastToNostr, getSigner, nostrAuth, relayList, relayPool } from '$lib/nostr';
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
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

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
	const isPortuguese = page.url.pathname.startsWith('/pt/');

	async function onContractDataFileSelected(file: File) {
		contractData = tryParseFinishedContract(await file.text());
	}

	function getUserShownData(psbtsMetadata: PsbtMetadata[] | null, contractData: Contract | null) {
		if (!psbtsMetadata || !contractData) return null;

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
				alert(
					isPortuguese
						? 'Os PSBTs não são equivalentes! Pode ser um bug ou um ator malicioso.'
						: 'PSBTs are not equivalent! This may either be a bug or a malicious actor'
				);
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
			{
				kinds: [SpendRequestEvent],
				'#h': [(await hashFromFile(contractFile)).toString('hex')]
			},
			{
				onevent(e) {
					const { psbtsMetadata } = JSON.parse(e.content) as SpendRequestPayload;
					psbtsMetadataStringified = JSON.stringify(psbtsMetadata);
				}
			}
		);
	}

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

		const signer = getSigner(networkName);
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
						if (!isLiquid)
							throw new Error(isPortuguese ? 'Rede não é Liquid' : 'Network is not liquid');

						const redeemOutput = multisigScripts
							.find(({ combination }: { combination: string[] }) =>
								combination
									.sort()
									.every((pubkey: string, i: number) => pubkey === metadata.pubkeys.sort()[i])
							)
							?.leaf.output.toString('hex');

						if (!redeemOutput)
							throw new Error(isPortuguese ? 'Sem redeem output' : 'No redeem output');

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

				const clientSigAmount = clientSigs.reduce(
					(acc: number, sig: unknown) => (sig ? acc + 1 : acc),
					0
				);
				const arbitratorSigAmount = arbitratorSigs.reduce(
					(acc: number, sig: unknown) => (sig ? acc + 1 : acc),
					0
				);

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

			if (generatedPSBTsMetadata.length === 1) {
				const psbt = Psbt.fromHex(generatedPSBTsMetadata[0].psbtHex, { network: network });
				psbt.finalizeAllInputs();
				const tx = psbt.extractTransaction();
				if (tx.locktime !== 0) transactionLocktime = tx.locktime;
				generatedTransactionHex = tx.toHex();
			}
		}
	}

	$: psbtsClipboardValue = generatedPSBTsMetadata ? JSON.stringify(generatedPSBTsMetadata) : '';

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

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8">
	{#if !generatedPSBTsMetadata && !psbtsMetadata}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Continuar gasto' : 'Continue spend'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Cole, solte ou espere um PSBT de outra parte, depois revise e assine.'
					: 'Paste, drop, or wait for a PSBT from another party, then review and sign.'}
			</p>
		</div>

		<Card class="flex flex-col gap-5">
			<label class="flex flex-col gap-2">
				<span class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Hex do PSBT' : 'PSBT hex'}
				</span>
				<textarea
					bind:value={psbtsMetadataStringified}
					placeholder={isPortuguese ? 'Cole aqui o hex do PSBT…' : 'Paste PSBT hex here…'}
					class="min-h-[120px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-4 py-3 font-mono text-xs text-[rgb(var(--text))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
				></textarea>
			</label>

			<div class="relative flex items-center">
				<div class="flex-1 border-t border-[rgb(var(--border))]"></div>
				<span
					class="px-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>{isPortuguese ? 'ou' : 'or'}</span
				>
				<div class="flex-1 border-t border-[rgb(var(--border))]"></div>
			</div>

			<FileDrop
				dropText={isPortuguese ? 'Solte aqui o arquivo PSBT' : 'Drop PSBT file here'}
				bind:files={psbtFiles}
			/>

			{#if !contractFile && !$contractDataFileStore}
				<div class="relative flex items-center">
					<div class="flex-1 border-t border-[rgb(var(--border))]"></div>
					<span
						class="px-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>
						{isPortuguese ? 'ou do nostr' : 'or from nostr'}
					</span>
					<div class="flex-1 border-t border-[rgb(var(--border))]"></div>
				</div>
				<DropDocument bind:file={contractFile} />
			{:else}
				<div
					class="rounded-2xl border border-pls-blue-500/30 bg-pls-blue-500/10 p-4 text-center text-sm font-semibold text-pls-blue-400"
				>
					{isPortuguese ? 'Aguardando um evento nostr…' : 'Waiting for a nostr event…'}
				</div>
			{/if}
		</Card>
	{/if}

	{#if generatedTransactionHex}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Transação pronta' : 'Transaction ready'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Publique na rede ou salve para depois.'
					: 'Publish it to the network or save it for later.'}
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
				<Button variant="primary" on:click={publish}>{isPortuguese ? 'Publicar' : 'Publish'}</Button
				>
				<CopyButton
					value={generatedTransactionHex ?? ''}
					variant="primary"
					label={isPortuguese ? 'Copiar hex' : 'Copy hex'}
				/>
			</div>
		</Card>
	{:else if generatedPSBTsMetadata}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'PSBT assinado' : 'PSBT signed'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Envie para outra parte para que ela possa continuar.'
					: 'Send it to another party so they can continue.'}
			</p>
		</div>
		<Card class="flex flex-wrap justify-center gap-3">
			<CopyButton
				value={psbtsClipboardValue}
				variant="primary"
				label={isPortuguese ? 'Copiar PSBT' : 'Copy PSBT'}
			/>
			<Button variant="outline" on:click={sendViaNostr}
				>{isPortuguese ? 'Enviar via Nostr' : 'Send via Nostr'}</Button
			>
		</Card>
	{:else if userShownData}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Revisar transação' : 'Review transaction'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Confira as saídas abaixo antes de assinar.'
					: 'Double-check the outputs below before signing.'}
			</p>
		</div>

		<Card class="flex flex-col gap-5">
			<h2 class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
				{isPortuguese ? 'Saídas' : 'Outputs'}
			</h2>
			<div class="flex flex-col gap-3">
				{#each userShownData.outputs as output}
					<div
						class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
					>
						<p class="text-xs font-medium text-[rgb(var(--text-faint))]">
							{isPortuguese ? 'Endereço' : 'Address'}
						</p>
						<p class="mt-1 break-all font-mono text-xs md:text-sm text-[rgb(var(--text))]">
							{output.address}
						</p>
						<div class="mt-3 flex items-center justify-between">
							<span class="text-xs font-medium text-[rgb(var(--text-faint))]">
								{isPortuguese ? 'Valor' : 'Amount'}
							</span>
							<span class="font-mono text-sm font-bold text-[rgb(var(--text))]"
								>{output.value} sats</span
							>
						</div>
					</div>
				{/each}
			</div>

			{#if userShownData.locktime !== 0}
				<div class="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
					<p class="text-xs font-semibold uppercase tracking-wider text-amber-400">Timelock</p>
					<p class="mt-1 text-[rgb(var(--text))]">
						{formatDateTime(new Date(userShownData.locktime * 1000))}
					</p>
				</div>
			{/if}

			<Button variant="primary" size="lg" fullWidth on:click={handleApproveTransaction}>
				{isPortuguese ? 'Aprovar transação' : 'Approve transaction'}
			</Button>
		</Card>
	{:else if psbtsMetadataStringified.length > 0}
		<Card class="text-center">
			<p class="text-lg font-semibold text-red-400">
				{isPortuguese ? 'PSBT inválido' : 'Invalid PSBT'}
			</p>
			<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Verifique os dados do PSBT e tente novamente.'
					: 'Please check the PSBT data and try again.'}
			</p>
		</Card>
	{/if}
</div>
