<script lang="ts">
	import {
		broadcastToNostr,
		getSigner,
		nostrAuth,
		nostrEncryptDmFactory,
		relayList,
		relayPool
	} from '$lib/nostr';
	import { onDestroy, onMount } from 'svelte';
	import {
		ContractRequestEvent,
		ContractApprovalEvent,
		type ContractRequestPayload,
		type ContractApprovalPayload
	} from '../shared';

	import { contractSchema, type UnsignedContract } from 'pls-full';

	import { tweakContractPubkey, signContract } from '$lib/pls/contract';
	import Person from '$lib/components/Person.svelte';
	import { downloadBlob, hashFromFile } from '$lib/utils';
	import { createBitcoinMultisig } from 'pls-bitcoin';
	import { ECPair, getNetworkByName, type NetworkNames } from '$lib/bitcoin';
	import { createLiquidMultisig } from 'pls-liquid';
	import DropDocument from '$lib/components/DropDocument.svelte';
	import { page } from '$app/stores';
	import type { SubCloser } from 'nostr-tools/pool';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let contractsData: Record<string, UnsignedContract> = {};
	let contractSignatures: Record<string, Record<string, string>> = {};

	let documentFile: File | undefined;
	let documentHash: string | undefined;
	let documentFileName: string | undefined;
	let relayListeners: SubCloser[] | undefined;

	$: eventId = $page.url.searchParams.get('eventId');

	$: if (documentFile)
		hashFromFile(documentFile).then((hash) => {
			documentHash = hash.toString('hex');
			documentFileName = documentFile!.name;
		});

	$: if (documentHash)
		tryConnectToRelays().then((listeners) => {
			relayListeners = listeners;
		});

	onMount(async () => {
		relayListeners = await tryConnectToRelays();
	});

	onDestroy(() => {
		relayListeners?.forEach((listener) => listener.close());
	});

	async function tryConnectToRelays() {
		if (!eventId) return;
		if (!documentHash) return;

		if (await nostrAuth.tryLogin()) {
			if (!$nostrAuth?.pubkey) return;

			const eventIds = [eventId];
			const tweakedPubkey = tweakContractPubkey(documentHash, $nostrAuth.pubkey);

			const contractListener = relayPool.subscribeMany(
				relayList,
				{
					kinds: [ContractRequestEvent],
					ids: eventIds,
					'#h': [tweakedPubkey]
				},
				{
					async onevent(e) {
						const encryptedContractPrivkeyTag =
							e.tags.filter((tag) => tag[0] === 'secret').find((tag) => tag[1] === tweakedPubkey) ||
							[];

						const encryptedContractPrivkey = encryptedContractPrivkeyTag[2];

						if (encryptedContractPrivkey === undefined)
							throw new Error('Pubkey not found in allowed pubkeys list');

						const contractPrivkey = await nostrAuth.decryptDM(e.pubkey, encryptedContractPrivkey);

						const contractEncryptDm = nostrEncryptDmFactory(contractPrivkey);

						const data = JSON.parse(
							await contractEncryptDm.decryptDM(e.pubkey, e.content)
						) as ContractRequestPayload;

						contractsData[data.fileHash] = {
							collateral: {
								arbitratorsQuorum: data.arbitratorsQuorum,
								multisigAddress: getMultisigAddress({
									arbitrators: data.arbitratorPubkeys,
									arbitratorsQuorum: data.arbitratorsQuorum,
									clients: data.clientPubkeys,
									network: data.network
								}),
								network: data.network,
								privateBlindingKey:
									'0000000000000000000000000000000000000000000000000000000000000001',
								pubkeys: {
									clients: data.clientPubkeys,
									arbitrators: data.arbitratorPubkeys
								},
								type: 'taproot-v0'
							},
							communication: {
								identifiers: {
									clients: data.clientPubkeys,
									arbitrators: data.arbitratorPubkeys
								},
								type: 'nostr'
							},
							document: {
								pubkeys: {
									clients: data.clientPubkeys,
									arbitrators: data.arbitratorPubkeys
								},
								fileHash: data.fileHash
							},
							version: 0
						};
					}
				}
			);

			const signaturesListener = relayPool.subscribeMany(
				relayList,
				{
					kinds: [ContractApprovalEvent],
					'#h': [tweakedPubkey],
					'#d': eventIds
				},
				{
					async onevent(e) {
						const { signature, fileHash } = JSON.parse(
							await nostrAuth.decryptDM(e.pubkey, e.content)
						) as ContractApprovalPayload;

						if (!contractSignatures[fileHash]) contractSignatures[fileHash] = {};

						contractSignatures[fileHash][e.pubkey] = signature;
					}
				}
			);

			return [contractListener, signaturesListener];
		}
	}

	function handleCopyContractLink() {
		navigator.clipboard.writeText(document.location.href);
		alert('Link copied to clipboard');
	}

	async function handleApprove(fileHash: string) {
		if (!$nostrAuth?.pubkey) return;
		if (!eventId) return;
		if (!documentHash) return;

		const dataToSign = contractsData[fileHash];

		const signer = getSigner(dataToSign.collateral.network);
		if (!signer) return;

		const signature = (await signContract(signer, dataToSign)).toString('hex');

		const pubkeys = [
			...dataToSign.document.pubkeys.arbitrators,
			...dataToSign.document.pubkeys.clients
		];

		const payload = JSON.stringify({
			signature: signature,
			fileHash
		} satisfies ContractApprovalPayload);

		for (const pubkey of pubkeys) {
			const encryptedText = await nostrAuth.encryptDM(pubkey, payload);
			const tweakedPubkey = tweakContractPubkey(documentHash, pubkey);

			const event = await nostrAuth.makeEvent(ContractApprovalEvent, encryptedText, [
				['h', tweakedPubkey],
				['d', eventId]
			]);

			broadcastToNostr(event);
		}
	}

	function isContractSignedBy(fileHash: string, pubkey: string) {
		for (const [hash, signatures] of Object.entries(contractSignatures)) {
			if (hash !== fileHash) return false;
			if (Object.keys(signatures).includes(pubkey)) return true;
		}
		return false;
	}

	function hasAllSignatures(fileHash: string) {
		if (contractsData[fileHash] === undefined || contractSignatures[fileHash] === undefined)
			return false;

		return [
			...contractsData[fileHash].document.pubkeys.clients,
			...contractsData[fileHash].document.pubkeys.arbitrators
		].every((pubkey) => Object.keys(contractSignatures[fileHash]).includes(pubkey));
	}

	function getMultisigAddress({
		arbitratorsQuorum,
		arbitrators,
		clients,
		network: networkName
	}: {
		arbitratorsQuorum: number;
		arbitrators: string[];
		clients: string[];
		network: NetworkNames;
	}) {
		const { isLiquid, network } = getNetworkByName(networkName);

		return isLiquid
			? createLiquidMultisig(clients, arbitrators, arbitratorsQuorum, network).confidentialAddress
			: createBitcoinMultisig(
					clients.map((pubkey) =>
						ECPair.fromPublicKey(Buffer.from('02' + pubkey.slice(-64), 'hex'))
					),
					arbitrators.map((pubkey) =>
						ECPair.fromPublicKey(Buffer.from('02' + pubkey.slice(-64), 'hex'))
					),
					arbitratorsQuorum,
					network
				).multisig.address!;
	}

	function exportContract(fileHash: string) {
		if (!documentFileName) return;

		const parsed = contractSchema.safeParse({
			...contractsData[fileHash],
			signatures: contractSignatures[fileHash]
		});

		const fileName = documentFileName.includes('.')
			? documentFileName.split('.')[0]
			: documentFileName;

		if (parsed.success)
			downloadBlob(new Blob([JSON.stringify(parsed.data, null, 4)]), `${fileName}.json`);

		return parsed;
	}

	$: isPortuguese = $page.url.pathname.startsWith('/pt/');
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			{isPortuguese ? 'Entrar no contrato' : 'Join contract'}
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Revise as partes, confirme o documento e assine.'
				: 'Review the parties, confirm the document, and sign.'}
		</p>
	</div>

	{#each Object.values(contractsData) as data}
		<Card class="flex flex-col gap-8">
			<div class="grid gap-8 md:grid-cols-2">
				<div>
					<h2
						class="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>
						{isPortuguese ? 'Clientes' : 'Clients'}
					</h2>
					<div class="flex flex-wrap gap-4">
						{#key contractSignatures}
							{#each data.document.pubkeys.clients as pubkey}
								{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
								<div
									class="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 {signed
										? '!border-emerald-500/40'
										: ''}"
								>
									<Person {pubkey} />
									<Badge variant={signed ? 'success' : 'pending'}>
										{signed
											? isPortuguese
												? 'Assinado'
												: 'Signed'
											: isPortuguese
												? 'Aguardando'
												: 'Waiting'}
									</Badge>
								</div>
							{/each}
						{/key}
					</div>
				</div>

				<div>
					<h2
						class="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>
						{isPortuguese ? 'Árbitros' : 'Arbitrators'}
					</h2>
					<div class="flex flex-wrap gap-4">
						{#key contractSignatures}
							{#each data.document.pubkeys.arbitrators as pubkey}
								{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
								<div
									class="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 {signed
										? '!border-emerald-500/40'
										: ''}"
								>
									<Person {pubkey} />
									<Badge variant={signed ? 'success' : 'pending'}>
										{signed
											? isPortuguese
												? 'Assinado'
												: 'Signed'
											: isPortuguese
												? 'Aguardando'
												: 'Waiting'}
									</Badge>
								</div>
							{/each}
						{/key}
					</div>
				</div>
			</div>

			<div class="grid gap-3 border-t border-[rgb(var(--border))] pt-5 sm:grid-cols-2">
				<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
					<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
						{isPortuguese ? 'Árbitros necessários' : 'Arbitrators needed'}
					</p>
					<p class="mt-1 font-mono text-lg font-bold text-[rgb(var(--text))]">
						{data.collateral.arbitratorsQuorum}
					</p>
				</div>
				<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
					<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
						{isPortuguese ? 'Rede' : 'Network'}
					</p>
					<p class="mt-1 font-mono text-lg font-bold text-[rgb(var(--text))]">
						{data.collateral.network}
					</p>
				</div>
			</div>

			<div class="flex flex-col gap-3 border-t border-[rgb(var(--border))] pt-5">
				{#if data.document.fileHash === documentHash}
					{#key contractSignatures}
						<Button
							variant="primary"
							size="lg"
							fullWidth
							on:click={() => handleApprove(data.document.fileHash)}
							disabled={$nostrAuth
								? isContractSignedBy(data.document.fileHash, $nostrAuth?.pubkey)
								: true}
						>
							{isPortuguese ? 'Aprovar e assinar' : 'Approve & sign'}
						</Button>
					{/key}
				{:else if documentHash !== undefined}
					<div
						class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm font-semibold text-red-400"
					>
						{isPortuguese ? 'O texto do contrato não confere!' : "Contract text doesn't match!"}
					</div>
				{/if}

				{#if eventId}
					<div class="flex flex-col gap-2">
						<p class="text-center text-xs text-[rgb(var(--text-muted))]">
							{isPortuguese
								? 'Compartilhe este link com as outras partes:'
								: 'Share this link with the other parties:'}
						</p>
						<Button variant="outline" fullWidth on:click={handleCopyContractLink}>
							{isPortuguese ? 'Copiar link' : 'Copy link'}
						</Button>
					</div>
				{/if}

				{#key contractSignatures}
					{#if hasAllSignatures(data.document.fileHash)}
						<Button
							variant="primary"
							size="lg"
							fullWidth
							on:click={() => exportContract(data.document.fileHash)}
						>
							{isPortuguese ? 'Exportar Agreement Proof' : 'Export Agreement Proof'}
						</Button>
					{/if}
				{/key}
			</div>
		</Card>
	{:else}
		<Card class="text-center">
			{#if !documentFile && eventId}
				<p class="text-sm text-[rgb(var(--text-muted))]">
					{isPortuguese
						? 'Solte o documento do contrato para liberar o fluxo de assinatura.'
						: 'Drop the contract document to unlock the signing flow.'}
				</p>
			{:else}
				<p class="text-sm text-[rgb(var(--text-muted))]">
					{isPortuguese ? 'Nenhum pedido de contrato pendente.' : 'No pending contract requests.'}
				</p>
			{/if}
		</Card>
	{/each}

	{#if !documentFile || Object.keys(contractsData).length === 0}
		<Card>
			<DropDocument bind:file={documentFile} />
		</Card>
	{/if}
</div>
