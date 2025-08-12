<script lang="ts">
	import { peopleMetadata } from '$lib/stores';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { nip19 } from 'nostr-tools';

	export let pubkey: string;

	let iconSize = '' as 'xl';

	$: username = $peopleMetadata[pubkey]?.name ?? 'No name';

	$: peopleMetadata.fetchPerson(pubkey);
</script>

<div class="flex flex-col justify-center items-center">
	<div class="flex items-center gap-4 px-2">
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
	</div>
</div>
