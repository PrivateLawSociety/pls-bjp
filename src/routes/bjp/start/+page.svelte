<script lang="ts">
	import { goto } from '$app/navigation';
	import { nostrAuth } from '$lib/nostr';
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';

	let hasNostr = false;

	onMount(() => {
		hasNostr = !!(window as any).nostr;
	});

	async function useAlby() {
		try {
			await window.nostr!.getPublicKey();
			nostrAuth.tryLogin();
			goto('/');
		} catch (error) {
			alert("You haven't allowed Alby to connect with the app");
		}
	}
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 py-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			PLS Identity
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			Choose how you want to get started. Your keys stay in this browser.
		</p>
	</div>

	<div class={`grid w-full gap-4 ${hasNostr ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
		<a href="/bjp/start/new" class="group block">
			<Card
				class="flex h-full flex-col gap-3 transition-all group-hover:border-pls-blue-400 group-hover:shadow-glow"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow"
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
				<h2 class="text-lg font-bold text-[rgb(var(--text))]">New</h2>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Generate a fresh Nostr identity. You control the secret key.
				</p>
			</Card>
		</a>

		<a href="/bjp/start/import" class="group block">
			<Card
				class="flex h-full flex-col gap-3 transition-all group-hover:border-pls-blue-400 group-hover:shadow-glow"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--surface-2))] text-pls-blue-400 ring-1 ring-[rgb(var(--border-strong))]"
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
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				</div>
				<h2 class="text-lg font-bold text-[rgb(var(--text))]">Import / Recover</h2>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Paste your existing nsec to restore your identity.
				</p>
			</Card>
		</a>

		{#if hasNostr}
			<button on:click={useAlby} class="group block text-left">
				<Card
					class="flex h-full flex-col gap-3 transition-all group-hover:border-pls-blue-400 group-hover:shadow-glow"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
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
							<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
						</svg>
					</div>
					<h2 class="text-lg font-bold text-[rgb(var(--text))]">Use Alby</h2>
					<p class="text-sm text-[rgb(var(--text-muted))]">
						Connect your Nostr browser extension (NIP-07).
					</p>
				</Card>
			</button>
		{/if}
	</div>
</div>
