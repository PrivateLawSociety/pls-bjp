<script lang="ts">
	import { peopleMetadata } from '$lib/stores';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { nip19 } from 'nostr-tools';

	export let pubkey: string;
	export let hideName = false;
	export let divClass = '';

	$: username = $peopleMetadata[pubkey]?.name ?? 'No name';

	$: peopleMetadata.fetchPerson(pubkey);
</script>

<div class={`flex flex-col items-center gap-2 ${divClass}`}>
	{#if $peopleMetadata[pubkey]?.picture}
		<img
			src={$peopleMetadata[pubkey]?.picture}
			alt={username}
			title={nip19.npubEncode(pubkey)}
			class="h-16 w-16 rounded-2xl object-cover ring-1 ring-[rgb(var(--border-strong))]"
		/>
	{:else}
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgb(var(--surface-2))] ring-1 ring-[rgb(var(--border-strong))] text-[rgb(var(--text-faint))]"
		>
			<UserSolid size="md" />
		</div>
	{/if}

	{#if !hideName}
		<p
			title={username}
			class="line-clamp-2 w-20 break-words text-center text-xs font-medium text-[rgb(var(--text))]"
		>
			{username}
		</p>
	{/if}
</div>
