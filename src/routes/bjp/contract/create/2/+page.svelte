<script lang="ts">
	import { page } from '$app/state';
	import PersonChooser from '$lib/components/PersonChooser.svelte';
	import { nostrAuth } from '$lib/nostr';
	import { getContext, onMount } from 'svelte';
	import { peopleMetadata } from '$lib/stores';
	import type { Writable } from 'svelte/store';
	import { getContactsInfo, type NewContractData } from '../shared';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let myPubkey: string | null = null;
	let contactPubkeys: string[] = [];

	let newContract = getContext<Writable<NewContractData>>('contract');
	let clients: [string | null, string | null] = $newContract.clients ?? [null, null];

	$: $newContract.clients = clients;

	$: contactsAndMe = Array.from(
		myPubkey ? new Set([myPubkey, ...contactPubkeys]) : new Set(contactPubkeys)
	);

	onMount(async () => {
		if (await nostrAuth.tryLogin()) {
			const pubkey = $nostrAuth?.pubkey!;
			myPubkey = pubkey;
			peopleMetadata.fetchPerson(pubkey);
			contactPubkeys = (await getContactsInfo(pubkey)) ?? [];
		}
	});

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const nextPath = isPortuguese ? '/pt/bjp/contract/create/3' : '/bjp/contract/create/3';
</script>

<Card class="flex flex-col gap-6">
	<div>
		<h2 class="text-xl font-bold text-[rgb(var(--text))]">
			{isPortuguese ? 'Selecione os clientes' : 'Select clients'}
		</h2>
		<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Escolha as duas partes que irão concordar com este contrato.'
				: 'Pick the two parties that will agree to this contract.'}
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-6">
		<PersonChooser people={contactsAndMe} bind:selectedPerson={clients[0]} />
		<span class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]"
			>{isPortuguese ? 'e' : 'and'}</span
		>
		<PersonChooser people={contactsAndMe} bind:selectedPerson={clients[1]} />
	</div>

	<div class="flex justify-end">
		<Button href={nextPath} variant="primary" disabled={!(clients[0] && clients[1])}>
			{isPortuguese ? 'Próximo →' : 'Next →'}
		</Button>
	</div>
</Card>
