<script lang="ts">
	import { peopleMetadata } from '$lib/stores';
	import { UserSolid } from 'flowbite-svelte-icons';
	import { nip19 } from 'nostr-tools';

	export let pubkey: string;

	$: username = $peopleMetadata[pubkey]?.name ?? 'No name';
	$: npub = nip19.npubEncode(pubkey);

	$: peopleMetadata.fetchPerson(pubkey);
</script>

<a
	href="/bjp/keys"
	title={npub}
	class="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-all hover:border-[rgb(var(--border))] hover:bg-[rgb(var(--surface-2))]"
>
	<div class="relative">
		{#if $peopleMetadata[pubkey]?.picture}
			<img
				src={$peopleMetadata[pubkey]?.picture}
				alt={username}
				class="h-9 w-9 rounded-xl object-cover ring-1 ring-[rgb(var(--border-strong))]"
			/>
		{:else}
			<div
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-[rgb(var(--surface-2))] ring-1 ring-[rgb(var(--border-strong))] text-[rgb(var(--text-muted))]"
			>
				<UserSolid size="sm" />
			</div>
		{/if}
		<span
			class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[rgb(var(--bg))]"
		></span>
	</div>
	<div class="hidden sm:flex flex-col min-w-0">
		<span class="truncate max-w-[10rem] text-sm font-semibold text-[rgb(var(--text))]">
			{username}
		</span>
		<span class="font-mono text-[11px] text-[rgb(var(--text-faint))]">
			{`${npub.slice(0, 8)}…${npub.slice(-6)}`}
		</span>
	</div>
</a>
