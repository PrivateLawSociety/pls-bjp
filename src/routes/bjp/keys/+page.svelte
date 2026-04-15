<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { goto } from '$app/navigation';
	import { nip19 } from 'nostr-tools';

	onMount(() => {
		if (window.nostr) nostrAuth.tryLogin();
	});

	$: npub = $nostrAuth?.pubkey ? nip19.npubEncode($nostrAuth.pubkey) : '';
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			Your keys
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			Control the identity that signs your contracts.
		</p>
	</div>

	{#if !$nostrAuth?.privkey && $nostrAuth?.pubkey}
		<div class="flex justify-center">
			<Badge variant="success" size="md">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				Logged in with Nostr extension
			</Badge>
		</div>
	{/if}

	{#if $nostrAuth?.pubkey}
		<Card class="flex flex-col gap-6">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					Public ID
				</p>
				<div
					class="mt-2 flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
				>
					<p class="flex-1 break-all font-mono text-xs md:text-sm text-[rgb(var(--text))]">
						{npub}
					</p>
					<CopyButton value={npub} />
				</div>
			</div>

			<div class="flex justify-end">
				<Button
					variant="danger"
					on:click={() => {
						nostrAuth.signOut();
						goto('/');
					}}
				>
					Sign out
				</Button>
			</div>
		</Card>
	{:else}
		<Card class="text-center text-[rgb(var(--text-muted))]">
			No active identity. Go to <a href="/bjp/start" class="text-pls-blue-400 hover:underline"
				>/bjp/start</a
			> to create or import one.
		</Card>
	{/if}
</div>
