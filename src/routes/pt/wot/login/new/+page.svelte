<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { Checkbox, Input, Label, Toast } from 'flowbite-svelte';
	import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
	import { Buffer } from 'buffer';
	import { slide } from 'svelte/transition';
	import { nostrAuth } from '$lib/wot/nostr';

	import { page } from '$app/state';

	const npubParam = page.url.searchParams.get('npub');
	const urlParams = npubParam ? `?npub=${npubParam}` : '';

	let privateKey = generateSecretKey();
	let privateKeyStr = Buffer.from(privateKey).toString('hex');

	$: nsec = nip19.nsecEncode(privateKey);
	$: publicKey = getPublicKey(privateKey);
	$: npub = nip19.npubEncode(publicKey);

	let hasStoredKey = false;

	let copiedPubkey = false;
	let copiedPrivkey = false;
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8 py-10 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Rede de Confiança</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			Identidade PLS gerada
		</h1>
		<p class="max-w-2xl text-sm text-[rgb(var(--text-muted))] md:text-base">
			Guarde este par de chaves agora. Esta identidade controla seu perfil e suas avaliações.
		</p>
	</div>

	<Card variant="elevated" class="w-full">
		<div class="flex w-full flex-col items-center justify-center gap-6">
			<div class="w-full max-w-xl">
				<Label class="mb-2 text-[rgb(var(--text))]">ID público:</Label>
				<Input
					type="text"
					class="w-full cursor-pointer rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
					readonly
					value={npub}
					onclick={async () => {
						await navigator.clipboard.writeText(npub ?? '');

						copiedPubkey = true;

						setTimeout(() => (copiedPubkey = false), 3000);
					}}
				/>
				<p class="mt-1 text-xs text-[rgb(var(--text-faint))]">
					Este é seu identificador público. Você pode compartilhar com outras pessoas.
				</p>
			</div>
			<Toast
				class="m-3 w-max rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
				dismissable={false}
				bind:toastStatus={copiedPubkey}
				transition={slide}
			>
				ID público copiado.
			</Toast>

			<div class="w-full max-w-xl">
				<Label class="mb-2 text-[rgb(var(--text))]">Chave secreta:</Label>
				<Input
					type="text"
					class="w-full cursor-pointer rounded-xl border border-pls-blue-500/40 bg-pls-blue-500/5 text-[rgb(var(--text))]"
					readonly
					value={nsec}
					onclick={async () => {
						await navigator.clipboard.writeText(nsec ?? '');

						copiedPrivkey = true;

						setTimeout(() => (copiedPrivkey = false), 3000);
					}}
				/>
				<p class="mt-1 text-xs font-semibold text-amber-400">
					⚠️ Mantenha privada. Qualquer pessoa com esta chave pode controlar sua identidade.
				</p>
			</div>
			<Toast
				class="m-3 w-max rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
				dismissable={false}
				bind:toastStatus={copiedPrivkey}
				transition={slide}
			>
				✓ Chave secreta copiada.
			</Toast>
		</div>

		<div class="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-5">
			<div class="flex items-start gap-3">
				<span class="text-2xl">⚠️</span>
				<div class="flex-1">
					<h3 class="font-semibold text-[rgb(var(--text))]">Aviso importante de segurança</h3>
					<ul class="mt-2 space-y-1 text-sm text-[rgb(var(--text-muted))]">
						<li>- Salve sua chave secreta em local seguro</li>
						<li>- Nunca compartilhe sua chave secreta com ninguém</li>
						<li>- Não existe recuperação se você perder sua chave secreta</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="mt-6 flex items-center justify-center">
			<Label class="flex items-center gap-3 text-[rgb(var(--text))]">
				<Checkbox
					bind:checked={hasStoredKey}
					class="!bg-[rgb(var(--surface-2))] checked:!bg-pls-blue-500"
				/>
				Guardei minha chave secreta em um lugar seguro e privado
			</Label>
		</div>

		<div class="mt-6 flex flex-col items-center gap-4">
			<a href={npubParam ? `/pt/wot/rate${urlParams}` : '/pt/wot'} class="w-full max-w-xl">
				<Button
					disabled={!hasStoredKey}
					on:click={() => nostrAuth.loginWithPrivkey(privateKeyStr)}
					variant="primary"
					size="lg"
					fullWidth
				>
					Continuar
				</Button>
			</a>

			<a
				href="/pt/wot/login"
				class="text-sm font-medium text-pls-blue-400 transition-colors hover:text-pls-blue-300"
			>
				← Voltar para opções de login
			</a>
		</div>
	</Card>
</div>
