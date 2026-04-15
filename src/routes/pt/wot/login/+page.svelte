<script lang="ts">
	import { goto } from '$app/navigation';
	import { nostrAuth } from '$lib/wot/nostr';
	import Badge from '$lib/components/Badge.svelte';
	import Card from '$lib/components/Card.svelte';
	import { onMount } from 'svelte';

	import { page } from '$app/state';

	const npub = page.url.searchParams.get('npub');
	const urlParams = npub ? `?npub=${npub}` : '';

	let hasNostr = false;

	onMount(() => {
		hasNostr = !!(window as any).nostr;
	});

	async function useAlby() {
		try {
			const pubkey = await window.nostr!.getPublicKey();
			nostrAuth.loginWithPubkey(pubkey);

			if (npub) {
				await goto(`/pt/wot/rate${urlParams}`);
				return;
			}

			await goto('/pt/wot');
		} catch (error) {
			alert('Você não autorizou o Alby a conectar com o app');
		}
	}
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Rede de Confiança</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			Login da identidade PLS
		</h1>
		<p class="max-w-lg text-sm text-[rgb(var(--text-muted))] md:text-base">
			Escolha como entrar para avaliar alguém ou gerenciar seu perfil público de confiança.
		</p>
	</div>

	<div class={`grid w-full max-w-4xl gap-4 ${hasNostr ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
		<a href={`/pt/wot/login/new${urlParams}`} class="group block">
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
				<h2 class="text-xl font-bold text-[rgb(var(--text))]">Nova identidade</h2>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Gere uma identidade PLS nova e siga direto para o fluxo de avaliação.
				</p>
				<span class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400">
					Criar
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="5" y1="12" x2="19" y2="12" />
						<polyline points="12 5 19 12 12 19" />
					</svg>
				</span>
			</Card>
		</a>

		<a href={`/pt/wot/login/import${urlParams}`} class="group block">
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
				<h2 class="text-xl font-bold text-[rgb(var(--text))]">Importar / Recuperar</h2>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Cole seu `nsec` existente e retome de onde parou.
				</p>
				<span class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400">
					Restaurar
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="5" y1="12" x2="19" y2="12" />
						<polyline points="12 5 19 12 12 19" />
					</svg>
				</span>
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
					<h2 class="text-xl font-bold text-[rgb(var(--text))]">Usar Alby</h2>
					<p class="text-sm text-[rgb(var(--text-muted))]">
						Entre com sua extensão do navegador sem colar chaves no app.
					</p>
					<span class="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400">
						Conectar
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="5" y1="12" x2="19" y2="12" />
							<polyline points="12 5 19 12 12 19" />
						</svg>
					</span>
				</Card>
			</button>
		{/if}
	</div>
</div>
