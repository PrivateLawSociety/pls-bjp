<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { peopleMetadata } from '$lib/stores';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { nip19 } from 'nostr-tools';

	export let pubkey: string;

	let iconSize = '' as 'xl';
	let showDropdown = false;

	$: username = $peopleMetadata[pubkey]?.name ?? 'No name';
	$: peopleMetadata.fetchPerson(pubkey);

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleLogout() {
		showDropdown = false;
		nostrAuth.signOut();
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const dropdown = document.getElementById('user-dropdown');
		const button = document.getElementById('user-dropdown-button');

		if (dropdown && button && !dropdown.contains(target) && !button.contains(target)) {
			showDropdown = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="flex flex-col justify-center items-center">
	<div class="flex items-center gap-4 px-2 relative">
		<button
			id="user-dropdown-button"
			on:click={toggleDropdown}
			class="flex items-center gap-4 px-2 py-2 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
		>

		{#if $peopleMetadata[pubkey]}
			<img
				src={$peopleMetadata[pubkey]?.picture}
				alt={username}
				title={nip19.npubEncode(pubkey)}
				class="w-10 h-10 rounded-full object-contain"
			/>
		{:else}
			<div class="w-10">
				<UserSolid size={iconSize} />
			</div>
		{/if}

			<div class="font-medium text-white">
				<div>{username || ''}</div>
				<div class="group relative">
					<span class="block max-w-24 text-sm text-gray-400">
						{`${nip19.npubEncode(pubkey).slice(0, 5)}...${nip19.npubEncode(pubkey).slice(-5)}`}
					</span>

					<span
						class="absolute right-0 top-full z-10 hidden whitespace-nowrap rounded-md border border-white bg-gray-800 p-2 text-sm text-white group-hover:block"
					>
						{nip19.npubEncode(pubkey)}
					</span>
				</div>
			</div>
		</button>

		{#if showDropdown}
			<div
				id="user-dropdown"
				class="absolute top-full right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20"
			>
				<div class="py-1">
					<button
						on:click={handleLogout}
						class="flex items-center gap-3 w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
					>
						Logout
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
