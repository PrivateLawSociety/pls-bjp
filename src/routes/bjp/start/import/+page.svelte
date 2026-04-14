<script lang="ts">
	import { ECPair } from '$lib/bitcoin';
	import { nostrAuth } from '$lib/nostr';
	import { Buffer } from 'buffer';
	import { nip19 } from 'nostr-tools';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let nsecInput = '';
	let secretKey: Uint8Array | null = null;
	let secretKeyStr: string | null = '';
	let showSecret = false;

	$: {
		try {
			let nsec = nip19.decode(nsecInput);

			if (nsec.type == 'nsec') {
				let ecpair = ECPair.fromPrivateKey(Buffer.from(nsec.data));
				secretKey = new Uint8Array(ecpair.privateKey?.buffer!);
				secretKeyStr = ecpair.privateKey?.toString('hex')!;
			} else {
				secretKey = null;
				secretKeyStr = null;
			}
		} catch (error) {
			secretKey = null;
			secretKeyStr = null;
		}
	}

	$: isValid = secretKeyStr !== null;
	$: showError = nsecInput.length > 0 && !isValid;
</script>

<div class="mx-auto flex w-full max-w-xl flex-col gap-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			Import identity
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			Paste your Nostr secret key to restore your PLS identity.
		</p>
	</div>

	<Card class="flex flex-col gap-5">
		<label class="flex flex-col gap-2">
			<span class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
				Your Nostr secret key
			</span>
			<div class="relative">
				{#if showSecret}
					<input
						type="text"
						bind:value={nsecInput}
						placeholder="nsec1..."
						class="w-full rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-4 py-3 pr-12 font-mono text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
						autocomplete="off"
						spellcheck="false"
					/>
				{:else}
					<input
						type="password"
						bind:value={nsecInput}
						placeholder="nsec1..."
						class="w-full rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-4 py-3 pr-12 font-mono text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
						autocomplete="off"
						spellcheck="false"
					/>
				{/if}
				<button
					type="button"
					on:click={() => (showSecret = !showSecret)}
					class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[rgb(var(--text-muted))] hover:text-pls-blue-400"
					aria-label={showSecret ? 'Hide' : 'Show'}
				>
					{#if showSecret}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
							/>
							<line x1="1" y1="1" x2="23" y2="23" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					{/if}
				</button>
			</div>
			{#if showError}
				<span class="text-xs text-red-400">Invalid nsec. Double-check and try again.</span>
			{:else if isValid}
				<span class="text-xs text-emerald-400">Valid secret key detected.</span>
			{/if}
		</label>

		<Button
			href="/"
			variant="primary"
			size="lg"
			fullWidth
			disabled={!isValid}
			on:click={() => {
				if (secretKeyStr) nostrAuth.loginWithPrivkey(secretKeyStr);
			}}
		>
			Continue
		</Button>
	</Card>
</div>
