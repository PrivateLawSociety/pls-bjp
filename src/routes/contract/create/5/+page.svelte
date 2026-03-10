<script lang="ts">
	import Person from '$lib/components/Person.svelte';
	import { Button, P } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { NewContractData } from '../shared';
	import { broadcastToNostr, makeNostrEvent, nostrEncryptDmFactory } from '$lib/nostr';
	import { goto } from '$app/navigation';
	import { ContractRequestEvent, type ContractRequestPayload } from '../../shared';
	import { isValidNetworkName } from '$lib/bitcoin';
	import { generateSecretKey, getPublicKey } from 'nostr-tools';
	import { tweakContractPubkey } from '$lib/pls/contract';

	let newContract = getContext<Writable<NewContractData>>('contract');

	$: clients = $newContract.clients!;
	$: arbitrators = $newContract.arbitrators!;
	$: arbitratorsQuorum = $newContract.arbitratorsQuorum!;
	$: documentName = $newContract.fileName!;
	$: documentHash = $newContract.fileHash!;
	$: network = $newContract.network!;

	async function requestSignatures() {
		if (!clients[0] || !clients[1]) return alert('Contracts need exactly 2 clients');

		if (arbitrators.length === 0) return alert('Select at least one arbitrator');

		if (!documentHash) return alert('Please select a file')!;

		const pubkeys = [clients[0], clients[1], ...arbitrators].map((pub) => pub.slice(-64));

		if (!isValidNetworkName(network)) return alert('Invalid network');

		const contractPrivkey = generateSecretKey();
		const contractPrivkeyStr = Buffer.from(contractPrivkey).toString('hex');
		const contractPubkey = getPublicKey(contractPrivkey);
		const contractEncryptDm = nostrEncryptDmFactory(contractPrivkeyStr);

		const contractRequestPayload = {
			arbitratorPubkeys: arbitrators.map((pub) => pub.slice(-64)),
			arbitratorsQuorum,
			clientPubkeys: [clients[0], clients[1]].map((pub) => pub.slice(-64)),
			fileHash: documentHash,
			network
		} satisfies ContractRequestPayload;

		const contractRequestEncryptedText = await contractEncryptDm.encryptDM(
			contractPubkey,
			JSON.stringify(contractRequestPayload)
		);

		const contractPrivkeySecretsTable = await Promise.all(
			pubkeys.map(async (pubkey) => {
				const encryptedSecret = await contractEncryptDm.encryptDM(
					pubkey,
					Buffer.from(contractPrivkey).toString('hex')
				);

				const tweakedPubkey = tweakContractPubkey(documentHash, pubkey);

				return ['secret', tweakedPubkey, encryptedSecret];
			})
		);

		const pubkeysHashTable = pubkeys.map((pubkey) => [
			'h',
			tweakContractPubkey(documentHash, pubkey)
		]);

		const contractRequestEvent = await makeNostrEvent(
			contractPrivkeyStr,
			ContractRequestEvent,
			contractRequestEncryptedText,
			[...pubkeysHashTable, ...contractPrivkeySecretsTable]
		);

		const contractEventId = contractRequestEvent.id;

		broadcastToNostr(contractRequestEvent);

		goto('/contract/join?eventId=' + contractEventId);
	}
</script>

<div class="flex items-center justify-center min-h-[calc(100vh-300px)] w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		<h2 class="text-2xl font-bold text-pls-blue-100 text-center mb-6">Review</h2>

		<div class="flex flex-col justify-center items-center gap-4 mb-6">
			<P color="none" size="xl" weight="bold" class="text-pls-blue-100">Clients:</P>
			{#if clients[0] || clients[1]}
				<div class="flex gap-2">
					<Person pubkey={clients[0] ?? ''} divClass="text-pls-blue-50 font-semibold" />
					<Person pubkey={clients[1] ?? ''} divClass="text-pls-blue-50 font-semibold" />
				</div>
			{/if}
			<P color="none" size="xl" weight="bold" class="text-pls-blue-100 mt-2">Arbitrators:</P>
			<div class="flex gap-2 flex-wrap justify-center">
				{#each arbitrators as arbitrator}
					<Person pubkey={arbitrator ?? ''} divClass="text-pls-blue-50 font-semibold" />
				{/each}
			</div>
			<P color="none" size="lg" class="text-pls-blue-100 font-bold mt-2">
				Arbitrators quorum:
				<span class="text-gray-700 font-normal">{arbitratorsQuorum}</span>
			</P>
			<P color="none" size="lg" class="text-pls-blue-100 font-bold">
				Network:
				<span class="text-gray-700 font-normal">{network}</span>
			</P>
			<P color="none" size="lg" class="text-pls-blue-100 font-bold">
				File:
				<span class="text-gray-700 font-normal">{documentName}</span>
			</P>
		</div>

		<div class="flex justify-center">
			<Button
				color="none"
				class="bg-white w-full text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors px-8 py-2"
				on:click={requestSignatures}
			>
				Create
			</Button>
		</div>
	</div>
</div>
