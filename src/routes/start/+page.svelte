<script lang="ts">
	import { goto } from '$app/navigation';
	import { nostrAuth } from '$lib/nostr';
	import { Button, P } from 'flowbite-svelte';
	import { onMount } from 'svelte';

	let hasNostr = false;

	onMount(() => {
		// only run in browser
		hasNostr = !!(window as any).nostr;
	});

	async function useAlby() {
		try {
			await window.nostr!.getPublicKey();

			nostrAuth.tryLogin();
			goto('/');
		} catch (error) {
			alert('You haven\'t allowed Alby to connect with the app');
		}
	}
</script>

<div class="flex items-center justify-center min-h-screen p-4">
	<!-- white centered card -->
	<div class="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
		<div class="flex justify-center mb-4">
			<P size="4xl" weight="bold" class="text-pls-blue-50" color="none">PLS Identity</P>
		</div>

		<div class="flex flex-col justify-center items-center gap-4">
			<a href="/start/new" class="w-full">
				<Button class="w-full bg-white text-black hover:bg-pls-blue-50 hover:text-white transition-colors" color="none">
					New
				</Button>
			</a>
			<a href="/start/import" class="w-full">
				<Button class="w-full bg-white text-black hover:bg-pls-blue-50 hover:text-white transition-colors" color="none">
					Import / Recover
				</Button>
			</a>
			{#if hasNostr}
				<Button class="w-full bg-white text-black hover:bg-pls-blue-50 hover:text-white transition-colors" color="none"
								on:click={useAlby}>Use alby
				</Button>
			{/if}
		</div>
	</div>
</div>
