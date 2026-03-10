<script lang="ts">
	import PersonChooser from '$lib/components/PersonChooser.svelte';
	import { Button, P } from 'flowbite-svelte';

	import { nostrAuth } from '$lib/nostr';
	import { getContext, onMount } from 'svelte';
	import { peopleMetadata } from '$lib/stores';
	import type { Writable } from 'svelte/store';
	import { getContactsInfo, type NewContractData } from '../shared';

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
</script>

<div class="flex items-center justify-center min-h-[calc(100vh-300px)] w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		<h2 class="text-2xl font-bold text-pls-blue-100 text-center mb-6">Select Contract Clients</h2>

		<div class="flex gap-4 items-center justify-center mb-6">
			<PersonChooser people={contactsAndMe} bind:selectedPerson={clients[0]} />
			<PersonChooser people={contactsAndMe} bind:selectedPerson={clients[1]} />
		</div>

		<div class="flex justify-center">
			<a href="/contract/create/3" class="w-full">
				<Button
					color="none"
					class="bg-red w-full text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors px-8 py-2"
					disabled={!(clients[0] && clients[1])}
				>
					Next
				</Button>
			</a>
		</div>
	</div>
</div>
