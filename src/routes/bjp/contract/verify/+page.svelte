<script lang="ts">
	import { page } from '$app/state';
	import { tryParseFinishedContract, verifyContract } from '$lib/pls/contract';
	import type { Contract } from 'pls-full';
	import { hashFromFile } from '$lib/utils';
	import Person from '$lib/components/Person.svelte';
	import { ECPair } from '$lib/bitcoin';
	import DropDocument from '$lib/components/DropDocument.svelte';
	import DropContract from '$lib/components/DropContract.svelte';
	import { contractDataFileStore } from '$lib/stores';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';

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

		return verifyContract(ecpair, contractData, Buffer.from(signature, 'hex'));
	}

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const depositPath = isPortuguese ? '/pt/bjp/multisig/deposit' : '/bjp/multisig/deposit';
	const startPath = isPortuguese ? '/pt/bjp/multisig/start' : '/bjp/multisig/start';
	const continuePath = isPortuguese ? '/pt/bjp/multisig/continue' : '/bjp/multisig/continue';
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-8">
	{#if contractData}
		{@const quorum = contractData.collateral.arbitratorsQuorum}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Verificação do contrato' : 'Contract verification'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Revise quem assinou, quem não assinou e como estão os termos.'
					: "Review who signed, who didn't, and what the terms look like."}
			</p>
		</div>

		<Card class="flex flex-col gap-8">
			<div class="grid gap-8 md:grid-cols-2">
				<div>
					<h2
						class="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>
						{isPortuguese ? 'Clientes' : 'Clients'}
					</h2>
					<div class="flex flex-wrap gap-4">
						{#each contractData.document.pubkeys.clients as pubkey}
							{@const valid = isSignatureValid(contractData, pubkey)}
							<div
								class="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 {valid
									? '!border-emerald-500/40'
									: '!border-red-500/40'}"
							>
								<Person {pubkey} />
								<Badge variant={valid ? 'success' : 'danger'}>
									{valid
										? isPortuguese
											? 'Assinado'
											: 'Signed'
										: isPortuguese
											? 'Sem assinatura'
											: 'Unsigned'}
								</Badge>
							</div>
						{/each}
					</div>
				</div>

				<div>
					<h2
						class="mb-4 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
					>
						{isPortuguese ? 'Árbitros' : 'Arbitrators'}
					</h2>
					<div class="flex flex-wrap gap-4">
						{#each contractData.document.pubkeys.arbitrators as pubkey}
							{@const valid = isSignatureValid(contractData, pubkey)}
							<div
								class="flex flex-col items-center gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 {valid
									? '!border-emerald-500/40'
									: '!border-red-500/40'}"
							>
								<Person {pubkey} />
								<Badge variant={valid ? 'success' : 'danger'}>
									{valid
										? isPortuguese
											? 'Assinado'
											: 'Signed'
										: isPortuguese
											? 'Inválido'
											: 'Invalid'}
								</Badge>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<div class="grid gap-3 border-t border-[rgb(var(--border))] pt-5 sm:grid-cols-2">
				<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
					<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
						{isPortuguese ? 'Quórum de árbitros' : 'Arbitrators quorum'}
					</p>
					<p class="mt-1 font-mono text-lg font-bold text-[rgb(var(--text))]">{quorum}</p>
				</div>
				<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
					<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
						{isPortuguese ? 'Rede' : 'Network'}
					</p>
					<p class="mt-1 font-mono text-lg font-bold text-[rgb(var(--text))]">
						{contractData.collateral.network}
					</p>
				</div>
			</div>

			{#if !documentHash || contractData.document.fileHash !== documentHash}
				<DropDocument bind:file={documentFile} />
			{/if}

			{#if documentFile}
				{@const valid = contractData.document.fileHash === documentHash}
				<div
					class="flex items-center justify-center gap-3 rounded-2xl border p-4 {valid
						? 'border-emerald-500/30 bg-emerald-500/5'
						: 'border-red-500/30 bg-red-500/5'}"
				>
					<span class="text-2xl">{valid ? '✅' : '❌'}</span>
					<span class="text-sm text-[rgb(var(--text))]">
						Contract text <strong>{valid ? 'matches' : "doesn't match"}</strong> the uploaded file.
						{#if isPortuguese}
							O texto do contrato <strong>{valid ? 'confere' : 'não confere'}</strong> com o arquivo enviado.
						{:else}
							Contract text <strong>{valid ? 'matches' : "doesn't match"}</strong> the uploaded file.
						{/if}
					</span>
				</div>
			{/if}

			<div class="grid gap-3 border-t border-[rgb(var(--border))] pt-5 md:grid-cols-3">
				<Button href={depositPath} variant="secondary"
					>{isPortuguese ? 'Depositar garantia' : 'Deposit collateral'}</Button
				>
				<Button href={startPath} variant="secondary"
					>{isPortuguese ? 'Iniciar decisão' : 'Start decision'}</Button
				>
				<Button href={continuePath} variant="secondary"
					>{isPortuguese ? 'Aprovar decisão' : 'Approve decision'}</Button
				>
			</div>
		</Card>
	{:else}
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Verificar contrato' : 'Verify contract'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Solte o JSON Agreement Proof para verificar as assinaturas.'
					: 'Drop the Agreement Proof JSON to verify its signatures.'}
			</p>
		</div>

		<Card>
			<DropContract bind:contractData />
		</Card>
	{/if}
</div>
