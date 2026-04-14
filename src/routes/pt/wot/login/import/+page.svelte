<script lang="ts">
	import { nostrAuth } from '$lib/wot/nostr';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { Input, Label } from 'flowbite-svelte';
	import { Buffer } from 'buffer';
	import { nip19 } from 'nostr-tools';

	import { page } from '$app/state';
	const npubParam = page.url.searchParams.get('npub');
	const urlParams = npubParam ? `?npub=${npubParam}` : '';

	let nsecInput = '';

	let secretKey: Uint8Array | null = null;
	let secretKeyStr: string | null = null;

	$: {
		try {
			let nsec = nip19.decode(nsecInput);

			if (nsec.type === 'nsec') {
				secretKey = new Uint8Array(nsec.data);
				secretKeyStr = Buffer.from(nsec.data).toString('hex');
			} else {
				secretKey = null;
				secretKeyStr = null;
			}
		} catch (error) {
			secretKey = null;
			secretKeyStr = null;
		}
	}
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Rede de Confiança</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			Importar identidade PLS
		</h1>
		<p class="max-w-lg text-sm text-[rgb(var(--text-muted))] md:text-base">
			Insira sua chave secreta para restaurar sua identidade e seguir para o fluxo da WoT.
		</p>
	</div>

	<Card class="mx-auto w-full max-w-md">
		<div class="space-y-6">
			<div class="flex flex-col gap-2">
				<Label class="pb-1 text-[rgb(var(--text))]">Chave secreta:</Label>
				<Input
					type="password"
					placeholder="nsec1..."
					bind:value={nsecInput}
					class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] placeholder-[rgb(var(--text-faint))]"
				/>
				{#if nsecInput && !secretKeyStr}
					<p class="text-sm text-red-400">
						Formato de chave secreta inválido. Use o formato `nsec`.
					</p>
				{/if}
				{#if secretKeyStr}
					<p class="text-sm font-semibold text-emerald-400">Chave secreta válida detectada</p>
				{/if}
			</div>

			<Button
				disabled={secretKeyStr === null}
				href={npubParam ? `/pt/wot/rate${urlParams}` : '/pt/wot'}
				on:click={() => {
					if (secretKeyStr) nostrAuth.loginWithPrivkey(secretKeyStr);
				}}
				variant="primary"
				size="lg"
				fullWidth
			>
				Continuar
			</Button>

			<div class="text-center">
				<a
					href="/pt/wot/login"
					class="text-sm font-medium text-pls-blue-400 transition-colors hover:text-pls-blue-300"
				>
					← Voltar para opções de login
				</a>
			</div>
		</div>
	</Card>
</div>
