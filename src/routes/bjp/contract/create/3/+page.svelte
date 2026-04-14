<script lang="ts">
	import { page } from '$app/state';
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { getContactsInfo, type NewContractData } from '../shared';
	import PersonChooser from '$lib/components/PersonChooser.svelte';
	import { nostrAuth } from '$lib/nostr';
	import { peopleMetadata } from '$lib/stores';
	import { Range } from 'flowbite-svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	const newContract = getContext<Writable<NewContractData>>('contract');

	let arbitrators: string[] = $newContract.arbitrators ?? [];
	let myPubkey: string | null = null;
	let contactPubkeys: string[] = [];
	let newlySelectedPubkey: string | null = null;
	let arbitratorsQuorum = $newContract.arbitratorsQuorum ?? 1;

	$: if (arbitratorsQuorum > arbitrators.length) {
		arbitratorsQuorum = arbitrators.length || 1;
	}

	$: contactsAndMe = Array.from(
		myPubkey ? new Set([myPubkey, ...contactPubkeys]) : new Set(contactPubkeys)
	);

	$: $newContract.arbitrators = arbitrators;
	$: $newContract.arbitratorsQuorum = arbitratorsQuorum;

	onMount(async () => {
		if (await nostrAuth.tryLogin()) {
			const pubkey = $nostrAuth?.pubkey!;
			myPubkey = pubkey;
			peopleMetadata.fetchPerson(pubkey);
			contactPubkeys = (await getContactsInfo(pubkey)) ?? [];
		}
	});

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const nextPath = isPortuguese ? '/pt/bjp/contract/create/4' : '/bjp/contract/create/4';
</script>

<Card class="flex flex-col gap-6">
	<div>
		<h2 class="text-xl font-bold text-[rgb(var(--text))]">
			{isPortuguese ? 'Selecione os árbitros' : 'Select arbitrators'}
		</h2>
		<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Árbitros resolvem impasses quando as partes discordam. Adicione quantos precisar.'
				: 'Arbitrators break ties when the parties disagree. Add as many as you need.'}
		</p>
	</div>

	<div class="flex flex-wrap items-start justify-center gap-4">
		{#each arbitrators as _, i}
			<PersonChooser
				people={contactsAndMe}
				on:selection={(e) => {
					if (e.detail === null) {
						arbitrators = arbitrators.filter((_, index) => index !== i);
					}
				}}
				bind:selectedPerson={arbitrators[i]}
			/>
		{/each}
		<PersonChooser
			people={contactsAndMe}
			on:selection={(e) => {
				arbitrators = [...arbitrators, e.detail];
				newlySelectedPubkey = null;
			}}
			bind:selectedPerson={newlySelectedPubkey}
			placeholderName={isPortuguese ? 'Adicionar novo' : 'Add new'}
		/>
	</div>

	{#if arbitrators.length > 1}
		<div class="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm font-semibold text-[rgb(var(--text))]">
						{isPortuguese ? 'Quórum de árbitros' : 'Arbitrators quorum'}
					</p>
					<p class="text-xs text-[rgb(var(--text-muted))]">
						{isPortuguese
							? 'Número mínimo de árbitros necessário para tomar uma decisão.'
							: 'Minimum number of arbitrators needed to make a decision.'}
					</p>
				</div>
				<span
					class="rounded-xl bg-gradient-brand px-3 py-1 font-mono text-sm font-bold text-white shadow-glow"
				>
					{arbitratorsQuorum} / {arbitrators.length}
				</span>
			</div>
			<div class="mt-3">
				<Range bind:value={arbitratorsQuorum} min={1} max={arbitrators.length || 1} />
			</div>
		</div>
	{/if}

	<div class="flex justify-end">
		<Button href={nextPath} variant="primary" disabled={arbitrators.length < 1}>
			{isPortuguese ? 'Próximo →' : 'Next →'}
		</Button>
	</div>
</Card>
