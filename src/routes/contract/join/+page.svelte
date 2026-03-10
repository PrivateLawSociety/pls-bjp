<script lang="ts">
	import {
		broadcastToNostr,
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
	import type { SubCloser } from 'nostr-tools/lib/types/pool';
	import { Button } from 'flowbite-svelte';

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
				[
					{
						kinds: [ContractRequestEvent],
						ids: eventIds,
						'#h': [tweakedPubkey]
					}
				],
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
								// TODO TODO TODO
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
				[
					{
						kinds: [ContractApprovalEvent],
						'#h': [tweakedPubkey],
						'#d': eventIds
					}
				],
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

		const signer = nostrAuth.getSigner(dataToSign.collateral.network);

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

	// TODO: also check if signature is valid
	function isContractSignedBy(fileHash: string, pubkey: string) {
		for (const [hash, signatures] of Object.entries(contractSignatures)) {
			if (hash !== fileHash) return false;

			if (Object.keys(signatures).includes(pubkey)) {
				return true;
			}
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

	function getMultisigAddress(
		{
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
</script>

<div class="flex items-center justify-center min-h-screen w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full">
		<h2 class="text-2xl font-bold text-pls-blue-100 text-center mb-6">Join Contract</h2>

		{#each Object.values(contractsData) as data}
			<div class="space-y-6">
				<div>
					<h3 class="text-lg font-semibold text-pls-blue-100 mb-3">Involved Clients:</h3>
					<div class="flex flex-wrap gap-4 justify-center">
						{#key contractSignatures}
							{#each data.document.pubkeys.clients as pubkey}
								{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
								<div
									class="flex flex-col items-center p-3 rounded-lg border-2 {signed ? 'border-green-400 bg-green-50' : 'border-gray-200'}">
									<Person {pubkey} divClass="text-pls-blue-50 font-semibold" />
									<span
										class="font-bold text-sm mt-1 {signed ? 'text-green-600' : 'text-gray-500'}">{signed ? 'Signed' : 'Waiting'}</span>
								</div>
							{/each}
						{/key}
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold text-pls-blue-100 mb-3">Involved Arbitrators:</h3>
					<div class="flex flex-wrap gap-4 justify-center">
						{#key contractSignatures}
							{#each data.document.pubkeys.arbitrators as pubkey}
								{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
								<div
									class="flex flex-col items-center p-3 rounded-lg border-2 {signed ? 'border-green-400 bg-green-50' : 'border-gray-200'}">
									<Person {pubkey} divClass="text-pls-blue-50 font-semibold" />
									<span
										class="font-bold text-sm mt-1 {signed ? 'text-green-600' : 'text-gray-500'}">{signed ? 'Signed' : 'Waiting'}</span>
								</div>
							{/each}
						{/key}
					</div>
				</div>

				<div class="border-t border-gray-200 pt-4 space-y-2">
					<p class="text-gray-700 text-center">
						<strong class="text-pls-blue-100">{data.collateral.arbitratorsQuorum}</strong> arbitrator(s) needs to agree
					</p>
					<p class="text-gray-700 text-center">
						Network: <strong class="text-pls-blue-100">{data.collateral.network}</strong>
					</p>
				</div>

				<div class="space-y-3 border-t border-gray-200 pt-4">
					{#if data.document.fileHash === documentHash}
						{#key contractSignatures}
							<Button
								color="none"
								class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
								on:click={() => handleApprove(data.document.fileHash)}
								disabled={$nostrAuth
									? isContractSignedBy(data.document.fileHash, $nostrAuth?.pubkey)
									: true}
							>
								Approve
							</Button>
						{/key}
					{:else if documentHash !== undefined}
						<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center font-semibold">
							Contract text doesn't match!
						</div>
					{/if}

					{#if eventId}
						<div class="space-y-2">
							<p class="text-gray-700 text-center text-sm">Send this contract link to the involved parties:</p>
							<Button color="none"
											class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
											on:click={handleCopyContractLink}>Copy link
							</Button>
						</div>
					{/if}

					{#key contractSignatures}
						{#if hasAllSignatures(data.document.fileHash)}
							<Button color="none"
											class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
											on:click={() => exportContract(data.document.fileHash)}
							>
								Export Agreement Proof
							</Button>
						{/if}
					{/key}
				</div>
			</div>
		{:else}
			<div class="text-center py-8">
				{#if !documentFile && eventId}
					<p class="text-gray-600 text-lg">Drop contract document to have access to the contract</p>
				{:else}
					<p class="text-gray-600 text-lg">No pending contract requests</p>
				{/if}
			</div>
		{/each}

		{#if !documentFile || Object.keys(contractsData).length === 0}
			<div class="mt-6 border-t border-gray-200 pt-6">
				<DropDocument bind:file={documentFile} />
			</div>
		{/if}
	</div>
</div>
