<script context="module" lang="ts">
	import { peopleMetadata } from '$lib/stores';
	import { nip19 } from 'nostr-tools';
	import { createEventDispatcher } from 'svelte';
	import Person from './Person.svelte';
	import { Dropdown, Search } from 'flowbite-svelte';
	import { UserAddSolid, UserRemoveSolid, UserSolid } from 'flowbite-svelte-icons';
</script>

<script lang="ts">
	export let selectedPerson: string | null = null;
	export let people: string[];

	export let placeholderName = 'Unselected';

	const dispatch = createEventDispatcher();

	let isDropdownOpen = false;
	let searchTerm = '';

	function selectPerson(pubkey: string | null) {
		selectedPerson = pubkey;
		isDropdownOpen = false;
		searchTerm = '';
		dispatch('selection', pubkey);
	}

	async function selectFromPubkey() {
		const result = prompt('What is the person\'s pubkey or npub?');

		if (result) {
			let pubkey = result.startsWith('npub') ? nip19.decode(result).data.toString() : result;

			selectPerson(pubkey);
		}
	}

	$: filteredPeople = people.filter((pubkey) =>
		$peopleMetadata[pubkey]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	let iconSize = '' as 'xl';
</script>

<button class="w-20 hover:opacity-80 transition-opacity">
	{#if selectedPerson}
		<Person pubkey={selectedPerson} divClass="text-pls-blue-50 font-semibold"/>
	{:else}
		<UserSolid size={iconSize} class="text-pls-blue-100" />
		<p class="text-pls-blue-100 font-medium">{placeholderName}</p>
	{/if}
</button>

<Dropdown
	bind:open={isDropdownOpen}
	color="none"
	class="!p-0 overflow-hidden text-sm w-64 bg-white shadow-lg border border-pls-blue-100 rounded-lg"
>
	<div class="p-2 bg-white border-b border-gray-200">
		<Search
			size="md"
			bind:value={searchTerm}
			color="none"
			class="border border-pls-blue-100 text-pls-blue-50 font-semibold focus:ring-pls-blue-50"
		/>
	</div>
	<div class="overflow-y-auto max-h-44">
		{#if filteredPeople.length === 0}
			<p class="px-3 py-2 text-gray-500 text-center">No results found.</p>
		{:else}
			{#each filteredPeople as pubkey (pubkey)}
				<button
					class="flex items-center px-3 py-2 hover:bg-pls-blue-50 hover:text-white w-full transition-colors text-pls-blue-100"
					on:click={() => selectPerson(pubkey)}
					title={nip19.npubEncode(pubkey)}
				>
					<img
						src={$peopleMetadata[pubkey]?.picture}
						alt={$peopleMetadata[pubkey]?.name}
						class="w-10 h-10 rounded-full mr-3 object-cover border-2 border-gray-200"
					/>
					<span class="break-all line-clamp-2 font-medium text-left">{$peopleMetadata[pubkey]?.name}</span>
				</button>
			{/each}
		{/if}
	</div>
	<div
		class="flex border-t border-gray-200"
		class:justify-between={selectedPerson !== null}
	>
		<button
			class="flex items-center px-3 py-2.5 text-sm font-medium text-pls-blue-100 bg-white hover:bg-pls-blue-50 hover:text-white transition-colors flex-1 justify-center"
			on:click={selectFromPubkey}
		>
			<UserAddSolid class="w-4 h-4 me-2" />
			Add by ID
		</button>

		{#if selectedPerson}
			<button
				class="flex items-center px-3 py-2.5 text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors flex-1 justify-center border-l border-gray-200"
				on:click={() => selectPerson(null)}
			>
				<UserRemoveSolid class="w-4 h-4 me-2" />
				Remove
			</button>
		{/if}
	</div>
</Dropdown>
