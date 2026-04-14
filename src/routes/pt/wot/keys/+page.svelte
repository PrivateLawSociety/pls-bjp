<script lang="ts">
	import { goto } from '$app/navigation';
	import { nostrAuth } from '$lib/wot/nostr';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { nip19 } from 'nostr-tools';
	import { onMount } from 'svelte';

	import { page } from '$app/state';

	onMount(() => {
		if (window.nostr) nostrAuth.tryLogin();
	});
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Rede de Confiança</Badge>
		{#if !$nostrAuth?.privkey && $nostrAuth?.pubkey}
			<p class="text-sm text-[rgb(var(--text-muted))]">Conectado com extensão Nostr do navegador</p>
		{/if}
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			Sua identidade
		</h1>
	</div>

	<Card class="mx-auto flex w-full max-w-xl flex-col gap-5 text-center">
		{#if $nostrAuth?.pubkey}
			<p class="text-sm uppercase tracking-wide text-[rgb(var(--text-faint))]">
				Seu ID público: <br />
			</p>
			<pre
				class="whitespace-pre-wrap break-all rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm text-[rgb(var(--text))]">{nip19.npubEncode(
					$nostrAuth?.pubkey
				)}</pre>

			<Button
				variant="primary"
				size="lg"
				fullWidth
				on:click={async () => {
					try {
						await navigator.clipboard.writeText(
							`${page.url.origin}/pt/wot/rate?npub=${nip19.npubEncode($nostrAuth?.pubkey)}`
						);
						alert('URL copiada!');
					} catch (error) {
						console.error('Falha ao copiar URL de avaliação:', error);
					}
				}}
			>
				Copiar URL de avaliação
			</Button>

			<Button
				variant="secondary"
				size="lg"
				fullWidth
				on:click={() => {
					nostrAuth.signOut();
					goto('/pt/wot');
				}}
			>
				Sair
			</Button>
		{/if}
	</Card>
</div>
