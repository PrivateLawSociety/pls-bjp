<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { Checkbox } from 'flowbite-svelte';
	import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	const acknowledgements = [
		'With bitcoin, you are your own bank. No one can recover your secret key if you lose it.',
		'If you lose your secret key, your PLS identity and your bitcoin cannot be recovered.',
		'If someone has access to your secret key, they can impersonate your PLS identity and potentially steal your bitcoin.'
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
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				Your new identity
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				Back it up now. We can't recover it for you.
			</p>
		</div>

		<Card class="flex flex-col gap-6">
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					Public ID (npub)
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

			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					Secret key (nsec)
				</p>
				<div
					class="mt-2 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"
				>
					<p class="flex-1 break-all font-mono text-xs md:text-sm text-[rgb(var(--text))]">
						{nsec}
					</p>
					<CopyButton value={nsec} />
				</div>
				<p class="mt-2 text-xs text-amber-400">
					⚠ Anyone with this key can impersonate you. Store it somewhere safe.
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
					I've stored my secret key in a safe and private place.
				</span>
			</label>

			<Button
				href="/"
				variant="primary"
				size="lg"
				fullWidth
				disabled={!hasStoredKeys}
				on:click={() => nostrAuth.loginWithPrivkey(privateKeyStr)}
			>
				Continue
			</Button>
		</Card>
	</div>
{:else}
	<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				Before we begin
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				Acknowledge what being your own bank means.
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
				I understand
			</Button>
		</Card>
	</div>
{/if}
