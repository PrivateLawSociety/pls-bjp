<script lang="ts">
	import { onMount } from 'svelte';
	import { broadcastToNostr, nostrAuth, relayList, relayPool } from '$lib/nostr';
	import {
		ContractRequestEvent,
		ContractApprovalEvent,
		type ContractRequestPayload,
		type ContractApprovalPayload
	} from '../shared';

	import {
		tryParseFinishedContract,
		signContract
	} from '$lib/pls/contract';

	import { contractSchema, type UnsignedContract } from 'pls-full';

	import { Button, P } from 'flowbite-svelte';

	import Person from '$lib/components/Person.svelte';
	import DropDocument from '$lib/components/DropDocument.svelte';

	import { downloadBlob, hashFromFile } from '$lib/utils';
	import { createBitcoinMultisig } from 'pls-bitcoin';
	import { ECPair, getNetworkByName, type NetworkNames } from '$lib/bitcoin';
	import { createLiquidMultisig } from 'pls-liquid';

	let contractsData: Record<string, UnsignedContract> = {};
	let contractSignatures: Record<string, Record<string, string>> = {};

	let documentFile: File | undefined;
	let documentHash: string | undefined;
	let documentFileName: string | undefined;

	$: if (documentFile) {
		hashFromFile(documentFile).then((hash) => {
			documentHash = hash.toString('hex');
			documentFileName = documentFile!.name;
		});
	}

	let contractText = '';
	let parsedContract: ReturnType<typeof tryParseFinishedContract> | null = null;
	let errorMessage: string | null = null;

	function handleJoinContract() {
		errorMessage = null;
		parsedContract = null;
		const result = tryParseFinishedContract(contractText);
		if (result) {
			parsedContract = result;
		} else {
			errorMessage = 'The provided contract is invalid.';
		}
	}

	onMount(async () => {
		if (await nostrAuth.tryLogin()) {
			if (!$nostrAuth?.pubkey) return;

			relayPool.subscribeMany(
				relayList,
				[
					{
						kinds: [ContractRequestEvent],
						'#p': [$nostrAuth.pubkey]
					}
				],
				{
					async onevent(e) {
						const data = JSON.parse(
							await nostrAuth.decryptDM(e.pubkey, e.content)
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

			relayPool.subscribeMany(
				relayList,
				[
					{
						kinds: [ContractApprovalEvent],
						'#p': [$nostrAuth.pubkey]
					}
				],
				{
					async onevent(e) {
						const { signature, fileHash } = JSON.parse(
							await nostrAuth.decryptDM(e.pubkey, e.content)
						) as ContractApprovalPayload;

						if (!contractSignatures[fileHash]) {
							contractSignatures[fileHash] = {};
						}
						contractSignatures[fileHash][e.pubkey] = signature;
					}
				}
			);
		}
	});

	async function handleApprove(fileHash: string) {
		if (!$nostrAuth?.pubkey) return;
		const dataToSign = contractsData[fileHash];
		const signer = nostrAuth.getSigner(dataToSign.collateral.network);
		if (!signer) return;
		const signature = (await signContract(signer, dataToSign)).toString('hex');
		const pubkeys = [
			...dataToSign.document.pubkeys.arbitrators,
			...dataToSign.document.pubkeys.clients
		];
		const payload = JSON.stringify({
			signature,
			fileHash
		} satisfies ContractApprovalPayload);
		for (const pubkey of pubkeys) {
			const encryptedText = await nostrAuth.encryptDM(pubkey, payload);
			const event = await nostrAuth.makeEvent(ContractApprovalEvent, encryptedText, [
				['p', pubkey]
			]);
			broadcastToNostr(event);
		}
	}

	function isContractSignedBy(fileHash: string, pubkey: string) {
		for (const [hash, signatures] of Object.entries(contractSignatures)) {
			if (hash !== fileHash) continue;
			if (Object.keys(signatures).includes(pubkey)) return true;
		}
		return false;
	}

	function hasAllSignatures(fileHash: string) {
		if (!contractsData[fileHash] || !contractSignatures[fileHash]) return false;
		const { clients, arbitrators } = contractsData[fileHash].document.pubkeys;
		return [...clients, ...arbitrators].every((pubkey) =>
			Object.keys(contractSignatures[fileHash]).includes(pubkey)
		);
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
			? createLiquidMultisig(clients, arbitrators, arbitratorsQuorum, network)
				.confidentialAddress
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
		if (parsed.success) {
			downloadBlob(new Blob([JSON.stringify(parsed.data, null, 4)]), `${fileName}.json`);
		} else {
			console.error('Error exporting contract:', parsed.error);
		}
	}
</script>

<div class="flex flex-col justify-center items-center h-full m-8 mt-0">
	<div class="flex flex-col justify-center items-center">
		<P size="3xl" weight="bold">Join Contract</P>
	</div>

	<div class="flex flex-col items-center w-[400px] gap-2 mt-4">
		<input
			type="text"
			bind:value={contractText}
			class="border rounded p-2 w-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-600"
			placeholder="Put your contract hash here"
		/>

		<div class="flex justify-center w-full">
			<Button on:click={handleJoinContract} class="w-full md:w-auto">
				Enter the contract
			</Button>
		</div>

		{#if errorMessage}
			<p class="text-red-600 font-semibold">{errorMessage}</p>
		{/if}

		{#if parsedContract}
			<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded w-full">
				<p class="font-bold text-green-700">Valid contract!</p>
				<pre class="text-sm whitespace-pre-wrap mt-2">
{JSON.stringify(parsedContract, null, 2)}
				</pre>
			</div>
		{/if}
	</div>

	<div class="p-4 flex flex-col gap-4 w-[400px] mt-8">
		{#each Object.values(contractsData) as data}
			<p class="text-xl font-semibold">Involved clients:</p>
			<div class="flex flex-wrap gap-4">
				{#key contractSignatures}
					{#each data.document.pubkeys.clients as pubkey}
						{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
						<div class="flex flex-col items-center">
							<Person {pubkey} />
							<span class="text-2xl">{signed ? '✅' : '🕓'}</span>
							<span class="font-bold">{signed ? 'Signed' : 'Waiting'}</span>
						</div>
					{/each}
				{/key}
			</div>

			<p class="text-xl font-semibold">Involved arbitrators:</p>
			<div class="flex flex-wrap gap-4">
				{#key contractSignatures}
					{#each data.document.pubkeys.arbitrators as pubkey}
						{@const signed = isContractSignedBy(data.document.fileHash, pubkey)}
						<div class="flex flex-col items-center">
							<Person {pubkey} />
							<span class="text-2xl">{signed ? '✅' : '🕓'}</span>
							<span class="font-bold">{signed ? 'Signed' : 'Waiting'}</span>
						</div>
					{/each}
				{/key}
			</div>

			<p class="font-bold">{data.collateral.arbitratorsQuorum} arbitrators need to agree</p>
			<p>Network: {data.collateral.network}</p>

			<DropDocument bind:file={documentFile} />

			{#if data.document.fileHash === documentHash}
				{#key contractSignatures}
					<Button
						color="success"
						class="w-full md:w-auto"
						on:click={() => handleApprove(data.document.fileHash)}
						disabled={$nostrAuth
							? isContractSignedBy(data.document.fileHash, $nostrAuth?.pubkey)
							: true}
					>
						Approve
					</Button>
				{/key}
			{:else if documentHash !== undefined}
				<p class="text-red-600">Contract text doesn't match!</p>
			{/if}

			{#key contractSignatures}
				{#if hasAllSignatures(data.document.fileHash)}
					<Button color="warning" class="w-full md:w-auto" on:click={() => exportContract(data.document.fileHash)}>
						Export
					</Button>
				{/if}
			{/key}

			<hr class="my-4 border-gray-300" />
		{:else}
			<div class="text-center">
				<p>You have no pending contract requests</p>
			</div>
		{/each}
	</div>
</div>
