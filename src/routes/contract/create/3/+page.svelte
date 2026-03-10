<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { getContactsInfo, type NewContractData } from '../shared';
	import PersonChooser from '$lib/components/PersonChooser.svelte';
	import { nostrAuth } from '$lib/nostr';
	import { peopleMetadata } from '$lib/stores';
	import { Button, Label, P, Range } from 'flowbite-svelte';

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

	$: console.log($newContract.arbitratorsQuorum);
</script>

<div class="flex items-center justify-center min-h-[calc(100vh-300px)] w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		<h2 class="text-2xl font-bold text-pls-blue-100 text-center mb-6">Select Arbitrators</h2>

		<div class="flex flex-col justify-center items-center gap-4 mb-6">
			<div class="flex gap-4 flex-wrap justify-center items-center">
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
					placeholderName={'Add new'}
				/>
			</div>
			{#if arbitrators.length > 1}
				<div class="w-full">
					<P color="none" class="text-xl font-semibold text-pls-blue-100 text-center mb-2">Arbitrators Quorum</P>
					<div class="mx-12 text-center">
						<Label class="!text-pls-blue-50 text-sm">This is the minimum number of arbitrators needed to make a
							decision.</Label>
						<Range bind:value={arbitratorsQuorum} min={1} max={arbitrators.length || 1} />
					</div>
					<p class="text-center mt-2 font-bold text-pls-blue-100">{arbitratorsQuorum}</p>
				</div>
			{/if}
		</div>

		<div class="flex justify-center">
			<a href="/contract/create/4" class="w-full">
				<Button
					color="none"
					class="bg-white w-full text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors px-8 py-2"
					disabled={arbitrators.length < 1}
				>
					Next
				</Button>
			</a>
		</div>
	</div>
</div>
