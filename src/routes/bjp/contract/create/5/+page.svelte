<script lang="ts">
	import { page } from '$app/state';
	import Person from '$lib/components/Person.svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { NewContractData } from '../shared';
	import { broadcastToNostr, makeNostrEvent, nostrEncryptDmFactory } from '$lib/nostr';
	import { goto } from '$app/navigation';
	import { ContractRequestEvent, type ContractRequestPayload } from '../../shared';
	import { isValidNetworkName } from '$lib/bitcoin';
	import { generateSecretKey, getPublicKey } from 'nostr-tools';
	import { tweakContractPubkey } from '$lib/pls/contract';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let newContract = getContext<Writable<NewContractData>>('contract');

	$: clients = $newContract.clients!;
	$: arbitrators = $newContract.arbitrators!;
	$: arbitratorsQuorum = $newContract.arbitratorsQuorum!;
	$: documentName = $newContract.fileName!;
	$: documentHash = $newContract.fileHash!;
	$: network = $newContract.network!;
	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const joinPath = isPortuguese ? '/pt/bjp/contract/join?eventId=' : '/bjp/contract/join?eventId=';

	async function requestSignatures() {
		if (!clients[0] || !clients[1])
			return alert(
				isPortuguese
					? 'Contratos precisam de exatamente 2 clientes'
					: 'Contracts need exactly 2 clients'
			);
		if (arbitrators.length === 0)
			return alert(
				isPortuguese ? 'Selecione pelo menos um árbitro' : 'Select at least one arbitrator'
			);
		if (!documentHash) return alert(isPortuguese ? 'Selecione um arquivo' : 'Please select a file');

		const pubkeys = [clients[0], clients[1], ...arbitrators].map((pub) => pub.slice(-64));

		if (!isValidNetworkName(network))
			return alert(isPortuguese ? 'Rede inválida' : 'Invalid network');

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

		goto(joinPath + contractEventId);
	}
</script>

<Card class="flex flex-col gap-6">
	<div>
		<h2 class="text-xl font-bold text-[rgb(var(--text))]">
			{isPortuguese ? 'Revisar e criar' : 'Review & create'}
		</h2>
		<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Confirme os detalhes abaixo — depois do broadcast, o fluxo de assinaturas começa.'
				: 'Confirm the details below — once broadcast, this will start the signing flow.'}
		</p>
	</div>

	<div class="flex flex-col gap-8">
		<div>
			<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
				{isPortuguese ? 'Clientes' : 'Clients'}
			</h3>
			<div class="flex flex-wrap gap-4">
				{#if clients[0]}
					<div
						class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
					>
						<Person pubkey={clients[0]} />
					</div>
				{/if}
				{#if clients[1]}
					<div
						class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
					>
						<Person pubkey={clients[1]} />
					</div>
				{/if}
			</div>
		</div>

		<div>
			<h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
				{isPortuguese ? 'Árbitros' : 'Arbitrators'}
			</h3>
			<div class="flex flex-wrap gap-4">
				{#each arbitrators as arbitrator}
					<div
						class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
					>
						<Person pubkey={arbitrator ?? ''} />
					</div>
				{/each}
			</div>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Quórum' : 'Quorum'}
				</p>
				<p class="mt-1 font-mono text-sm font-bold text-[rgb(var(--text))]">
					{arbitratorsQuorum}
				</p>
			</div>
			<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Rede' : 'Network'}
				</p>
				<p class="mt-1 font-mono text-sm font-bold text-[rgb(var(--text))]">{network}</p>
			</div>
			<div class="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3">
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Arquivo' : 'File'}
				</p>
				<p class="mt-1 break-all text-sm font-bold text-[rgb(var(--text))]">{documentName}</p>
			</div>
		</div>
	</div>

	<Button variant="primary" size="lg" fullWidth on:click={requestSignatures}>
		{isPortuguese ? 'Criar contrato' : 'Create contract'}
	</Button>
</Card>
