<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { onMount } from 'svelte';
	import { Button } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { nip19 } from 'nostr-tools';

	onMount(() => {
		if (window.nostr) nostrAuth.tryLogin();
	});
</script>

<div class="flex items-center justify-center min-h-screen w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		{#if !$nostrAuth?.privkey && $nostrAuth?.pubkey}
			<h1 class="text-3xl text-center text-pls-blue-100 font-bold mb-6">
				Logged in with nostr browser extension
			</h1>
		{/if}

		{#if $nostrAuth?.pubkey}
			<div class="space-y-6">
				<div class="text-center">
					<p class="text-gray-700 mb-2 font-semibold">Your public ID:</p>
					<p
						class="break-all px-4 py-3 bg-gray-50 rounded-lg border border-gray-500 text-sm text-pls-blue-100 font-mono"
					>
						{nip19.npubEncode($nostrAuth?.pubkey)}
					</p>
				</div>

				<div class="flex justify-center">
					<Button
						color="none"
						class="bg-white text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors"
						on:click={() => {
							nostrAuth.signOut();
							goto('/');
						}}
					>
						Sign out
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>
