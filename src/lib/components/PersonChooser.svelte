<script context="module" lang="ts">
	import { peopleMetadata } from '$lib/stores';
	import { nip19 } from 'nostr-tools';
	import { createEventDispatcher } from 'svelte';
	import Person from './Person.svelte';
	import { Dropdown, Search } from 'flowbite-svelte';
	import { UserAddSolid, UserRemoveSolid } from 'flowbite-svelte-icons';
</script>

<script lang="ts">
	import { page } from '$app/stores';
	export let selectedPerson: string | null = null;
	export let people: string[];
	export let placeholderName = 'Unselected';

	const dispatch = createEventDispatcher();

	let isDropdownOpen = false;
	let searchTerm = '';
	$: isPortuguese = $page.url.pathname === '/pt' || $page.url.pathname.startsWith('/pt/');
	$: effectivePlaceholder =
		placeholderName === 'Unselected' && isPortuguese ? 'Não selecionado' : placeholderName;

	function selectPerson(pubkey: string | null) {
		selectedPerson = pubkey;
		isDropdownOpen = false;
		searchTerm = '';
		dispatch('selection', pubkey);
	}

	async function selectFromPubkey() {
		const result = prompt(
			isPortuguese ? 'Qual é a pubkey ou npub da pessoa?' : "What is the person's pubkey or npub?"
		);

		if (result) {
			let pubkey = result.startsWith('npub') ? nip19.decode(result).data.toString() : result;
			selectPerson(pubkey);
		}
	}

	$: filteredPeople = people.filter((pubkey) =>
		$peopleMetadata[pubkey]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
	);
</script>

<button
	type="button"
	class="group flex w-24 flex-col items-center gap-2 rounded-2xl border border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] p-3 transition-all hover:border-pls-blue-400 hover:bg-[rgb(var(--surface))]"
>
	{#if selectedPerson}
		<Person pubkey={selectedPerson} />
	{:else}
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface))] ring-1 ring-[rgb(var(--border))] text-[rgb(var(--text-faint))] group-hover:text-pls-blue-400"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19" />
				<line x1="5" y1="12" x2="19" y2="12" />
			</svg>
		</div>
		<p class="text-[11px] font-medium text-[rgb(var(--text-faint))] group-hover:text-pls-blue-400">
			{effectivePlaceholder}
		</p>
	{/if}
</button>

<Dropdown
	bind:isOpen={isDropdownOpen}
	class="!p-0 w-64 overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-sm backdrop-blur-xl shadow-glow-lg"
>
	<div class="border-b border-[rgb(var(--border))] p-2">
		<Search
			size="md"
			bind:value={searchTerm}
			color="none"
			class="!bg-[rgb(var(--surface-2))] !text-[rgb(var(--text))] border border-[rgb(var(--border))] focus:!ring-pls-blue-500/25 placeholder:!text-[rgb(var(--text-faint))]"
		/>
	</div>
	<div class="max-h-48 overflow-y-auto">
		{#if filteredPeople.length === 0}
			<p class="px-3 py-3 text-center text-xs text-[rgb(var(--text-faint))]">
				{isPortuguese ? 'Nenhum resultado encontrado.' : 'No results found.'}
			</p>
		{:else}
			{#each filteredPeople as pubkey (pubkey)}
				<button
					type="button"
					class="flex w-full items-center gap-3 border-b border-[rgb(var(--border))] px-3 py-2 text-left text-[rgb(var(--text))] transition-colors last:border-0 hover:bg-[rgb(var(--surface-2))]"
					on:click={() => selectPerson(pubkey)}
					title={nip19.npubEncode(pubkey)}
				>
					{#if $peopleMetadata[pubkey]?.picture}
						<img
							src={$peopleMetadata[pubkey]?.picture}
							alt={$peopleMetadata[pubkey]?.name}
							class="h-9 w-9 rounded-xl object-cover ring-1 ring-[rgb(var(--border-strong))]"
						/>
					{:else}
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--surface-2))] text-[rgb(var(--text-faint))] ring-1 ring-[rgb(var(--border))]"
						>
							?
						</div>
					{/if}
					<span class="line-clamp-2 break-all text-sm font-medium">
						{$peopleMetadata[pubkey]?.name ?? (isPortuguese ? 'Desconhecido' : 'Unknown')}
					</span>
				</button>
			{/each}
		{/if}
	</div>
	<div class="flex border-t border-[rgb(var(--border))]">
		<button
			type="button"
			class="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-pls-blue-400 transition-colors hover:bg-[rgb(var(--surface-2))]"
			on:click={selectFromPubkey}
		>
			<UserAddSolid class="h-4 w-4" />
			{isPortuguese ? 'Adicionar por ID' : 'Add by ID'}
		</button>
		{#if selectedPerson}
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 border-l border-[rgb(var(--border))] px-3 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10"
				on:click={() => selectPerson(null)}
			>
				<UserRemoveSolid class="h-4 w-4" />
				{isPortuguese ? 'Remover' : 'Remove'}
			</button>
		{/if}
	</div>
</Dropdown>
