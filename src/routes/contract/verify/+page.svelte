<script lang="ts">
	import { tryParseFinishedContract, verifyContract } from '$lib/pls/contract';
	import type { Contract } from 'pls-full';
	import { hashFromFile } from '$lib/utils';
	import Person from '$lib/components/Person.svelte';
	import { ECPair } from '$lib/bitcoin';
	import DropDocument from '$lib/components/DropDocument.svelte';
	import DropContract from '$lib/components/DropContract.svelte';
	import { contractDataFileStore } from '$lib/stores';

	let documentFile: File | null;
	let documentHash: string;

	let contractData: Contract | null = null;

	$: if ($contractDataFileStore) onContractDataFileSelected($contractDataFileStore);

	$: if (documentFile)
		hashFromFile(documentFile).then((hash) => {
			documentHash = hash.toString('hex');
		});

	async function onContractDataFileSelected(file: File) {
		contractData = tryParseFinishedContract(await file.text());
	}

	function isSignatureValid(contractData: Contract, pubkey: string) {
		const ecpair = ECPair.fromPublicKey(Buffer.from('02' + pubkey, 'hex'));
		const signature = contractData.signatures[pubkey];

		if (!signature) return false;

		const isValid = verifyContract(ecpair, contractData, Buffer.from(signature, 'hex'));

		return isValid;
	}
</script>

<div class="w-full flex flex-col justify-center items-center h-full gap-6 p-4">
	{#if contractData}
		{@const quorum = contractData.collateral.arbitratorsQuorum}
		<div class="flex justify-center w-full">
			<div class="bg-white rounded-lg p-6 max-w-4xl w-full shadow-lg flex flex-col gap-6">
				<h1 class="text-3xl font-bold text-pls-blue-100 text-center">Contract Verification</h1>
				<div class="flex justify-center flex-wrap gap-8">
					<div class="flex flex-col text-center gap-4">
						<p class="text-xl font-semibold text-pls-blue-100">Involved clients:</p>
						<div class="flex flex-wrap gap-4 justify-center">
							{#each contractData.document.pubkeys.clients as pubkey}
								{@const valid = isSignatureValid(contractData, pubkey)}
								<div class="flex flex-col items-center p-3 rounded-lg border-2 {valid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}">
									<Person {pubkey} divClass="text-pls-blue-50 font-semibold" />
									<span class="font-bold text-sm mt-1 {valid ? 'text-green-600' : 'text-red-600'}">{valid ? 'Signed' : 'Unsigned'}</span>
								</div>
							{/each}
						</div>
					</div>
					<div class="flex flex-col text-center gap-4">
						<p class="text-xl font-semibold text-pls-blue-100">Involved arbitrators:</p>
						<div class="flex flex-wrap gap-4 justify-center">
							{#each contractData.document.pubkeys.arbitrators as pubkey}
								{@const valid = isSignatureValid(contractData, pubkey)}
								<div class="flex flex-col items-center p-3 rounded-lg border-2 {valid ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}">
									<Person {pubkey} divClass="text-pls-blue-50 font-semibold" />
									<span class="font-bold text-sm mt-1 {valid ? 'text-green-600' : 'text-red-600'}">{valid ? 'Signed' : 'Invalid'}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div class="border-t border-gray-200 pt-4 space-y-2">
					<p class="text-pls-blue-50 text-center font-semibold">
						<span class="font-semibold text-pls-blue-100">Arbitrators quorum:</span> {quorum}
					</p>
					<p class="text-pls-blue-50 text-center">
						<span class="font-semibold text-pls-blue-100">Network:</span> {contractData.collateral.network}
					</p>
				</div>
				{#if !documentHash || contractData.document.fileHash !== documentHash}
					<DropDocument bind:file={documentFile} />
				{/if}
				{#if documentFile}
					{@const valid = contractData.document.fileHash === documentHash}
					<p class="text-center text-lg">
						<span class="text-2xl">{valid ? '✅' : '❌'}</span>
						<span class="text-gray-700">Contract text</span>
						<span class="font-bold text-gray-700">{valid ? 'matches' : `doesn't match`}</span>
					</p>
				{/if}
				<div class="border-t border-gray-200 pt-4 flex flex-col justify-center items-center gap-3">
					<a
						class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
						href="/multisig/deposit"
					>
						Deposit collateral
					</a>
					<a
						class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
						href="/multisig/start"
					>
						Start decision
					</a>
					<a
						class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white text-center rounded px-3 py-2 text-xl w-full transition-colors"
						href="/multisig/continue"
					>
						Approve decision
					</a>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex justify-center w-full">
			<div class="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg flex flex-col gap-4">
				<h1 class="text-3xl font-bold text-pls-blue-100 text-center mb-4">Verify Contract</h1>
				<DropContract bind:contractData />
			</div>
		</div>
	{/if}
</div>
