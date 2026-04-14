<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { Checkbox } from 'flowbite-svelte';
	import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	const acknowledgements = [
		'Com bitcoin, você é seu próprio banco. Ninguém pode recuperar sua chave secreta se você perder.',
		'Se você perder sua chave secreta, sua identidade PLS e seus bitcoins não podem ser recuperados.',
		'Se alguém tiver acesso à sua chave secreta, pode se passar por você e potencialmente roubar seus bitcoins.'
	];
	let agreed = acknowledgements.map(() => false);
	$: allAgreed = agreed.every(Boolean);

	let fullyAgreed = false;
	let hasStoredKeys = false;

	let privateKey = generateSecretKey();
	let privateKeyStr = Buffer.from(privateKey).toString('hex');

	$: nsec = nip19.nsecEncode(privateKey);
	$: publicId = getPublicKey(privateKey);
	$: npub = nip19.npubEncode(publicId);
</script>

{#if fullyAgreed}
	<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
		<div class="text-center">
			<h1 class="text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl">
				Sua nova identidade
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				Faça backup agora. Não podemos recuperar para você.
			</p>
		</div>

		<Card class="flex flex-col gap-6">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					ID público (npub)
				</p>
				<div
					class="mt-2 flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
				>
					<p class="flex-1 break-all font-mono text-xs text-[rgb(var(--text))] md:text-sm">
						{npub}
					</p>
					<CopyButton value={npub} />
				</div>
			</div>

			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					Chave secreta (nsec)
				</p>
				<div
					class="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
				>
					<p class="flex-1 break-all font-mono text-xs text-[rgb(var(--text))] md:text-sm">
						{nsec}
					</p>
					<CopyButton value={nsec} />
				</div>
				<p class="mt-2 text-xs text-amber-400">
					⚠ Qualquer pessoa com esta chave pode se passar por você. Guarde com segurança.
				</p>
			</div>

			<label
				class="flex cursor-pointer items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4"
			>
				<Checkbox
					bind:checked={hasStoredKeys}
					class="mt-0.5 !bg-[rgb(var(--surface))] focus:!ring-pls-blue-500/25 checked:!bg-pls-blue-500"
				/>
				<span class="text-sm text-[rgb(var(--text))]">
					Guardei minha chave secreta em um lugar seguro e privado.
				</span>
			</label>

			<Button
				href="/pt"
				variant="primary"
				size="lg"
				fullWidth
				disabled={!hasStoredKeys}
				on:click={() => nostrAuth.loginWithPrivkey(privateKeyStr)}
			>
				Continuar
			</Button>
		</Card>
	</div>
{:else}
	<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
		<div class="text-center">
			<h1 class="text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl">
				Antes de começar
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				Reconheça o que significa ser seu próprio banco.
			</p>
		</div>

		<Card class="flex flex-col gap-4">
			{#each acknowledgements as text, i}
				<label
					class="flex cursor-pointer items-start gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 transition-colors hover:border-pls-blue-400"
				>
					<Checkbox
						bind:checked={agreed[i]}
						class="mt-0.5 !bg-[rgb(var(--surface))] focus:!ring-pls-blue-500/25 checked:!bg-pls-blue-500"
					/>
					<span class="text-sm text-[rgb(var(--text))]">{text}</span>
				</label>
			{/each}

			<Button
				variant="primary"
				size="lg"
				fullWidth
				disabled={!allAgreed}
				on:click={() => (fullyAgreed = true)}
			>
				Eu entendo
			</Button>
		</Card>
	</div>
{/if}
