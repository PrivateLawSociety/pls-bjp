<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import { Button, Checkbox, Input, Label, P, Toast } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';
	import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

	let agreed1 = false;
	let agreed2 = false;
	let agreed3 = false;
	let fullyAgreed = false;

	let hasStoredKeys = false;

	let privateKey = generateSecretKey();
	let privateKeyStr = Buffer.from(privateKey).toString('hex');

	$: nsec = nip19.nsecEncode(privateKey);
	$: publicId = getPublicKey(privateKey);
	$: npub = nip19.npubEncode(publicId);

	let copiedPubkey = false;
	let copiedSeckey = false;
</script>

{#if fullyAgreed}
	<div class="w-full flex flex-col justify-center items-center h-full gap-4 p-4">
		<div class="flex justify-center">
			<P align="center" size="4xl" weight="normal">Generated PLS Identity</P>
		</div>

		<div class="flex justify-center w-full">
			<div class="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg flex flex-col gap-4">
				<div>
					<Label color="none" class="mb-2 text-pls-blue-100 font-bold">Public ID</Label>
					<Input
						color="none"
						class="cursor-pointer text-gray-600"
						type="text"
						readonly
						value={npub}
						on:click={async () => {
							await navigator.clipboard.writeText(npub ?? '');

							copiedPubkey = true;
							setTimeout(() => (copiedPubkey = false), 3000);
						}}
					/>
				</div>

				<Toast
					dismissable={false} bind:open={copiedPubkey}
					transition={slide}
					color="none"
					class="!bg-white !text-gray-700 border border-gray-200"
				>
					Copied public ID to clipboard.
				</Toast>

				<div>
					<Label color="none" class="mb-2 text-pls-blue-100 font-bold">Secret key</Label>
					<Input
						color="none"
						class="cursor-pointer text-gray-600"
						type="text"
						readonly
						on:click={async () => {
							await navigator.clipboard.writeText(nsec);

							copiedSeckey = true;
							setTimeout(() => (copiedSeckey = false), 3000);
						}}

						value={nsec}
					/>
				</div>

				<Toast
					dismissable={false}
					bind:open={copiedSeckey}
					transition={slide}
					color="none"
					class="!bg-white !text-gray-700 border border-gray-200"
				>
					Copied secret key to clipboard.
				</Toast>

				<label class="flex w-full gap-4 mt-4 cursor-pointer">
					<Checkbox
						bind:checked={hasStoredKeys}
						class="!bg-white !text-pls-blue-100 focus:!ring-pls-blue-100 checked:!bg-pls-blue-100"
					/>
					<span class="text-gray-700 text-sm">
						I've stored my secret key in a safe and private place
					</span>
				</label>

				<a href="/">
					<Button
						disabled={!hasStoredKeys}
						on:click={() => nostrAuth.loginWithPrivkey(privateKeyStr)}
						color="none"
						class="w-full bg-pls-blue-100 text-white mt-4"
					>
						Continue
					</Button>
				</a>
			</div>
		</div>
	</div>
{:else}
	<div class="w-full flex flex-col justify-center items-center h-full gap-4 p-4">
		<div class="flex justify-center">
			<P size="4xl" weight="normal">Understanding</P>
		</div>

		<div class="flex justify-center w-full">
			<div class="bg-white rounded-lg p-6 max-w-2xl w-full shadow-lg flex flex-col gap-4">
				<p class="text-pls-blue-100 font-semibold text-center mb-2">By using PLS you understand and agree with the
					following:</p>

				<label class="flex w-full gap-4 cursor-pointer">
					<Checkbox
						bind:checked={agreed1}
						class="!bg-white !text-pls-blue-100 focus:!ring-pls-blue-100 checked:!bg-pls-blue-100"
					/>
					<span class="text-gray-700 text-sm">
						With bitcoin, you are your own bank. No one can recover your secret key if you lose it.
					</span>
				</label>

				<label class="flex w-full gap-4 cursor-pointer">
					<Checkbox
						bind:checked={agreed2}
						class="!bg-white !text-pls-blue-100 focus:!ring-pls-blue-100 checked:!bg-pls-blue-100"
					/>
					<span class="text-gray-700 text-sm">
						If you lose your secret key, your PLS identity and your bitcoin cannot be recovered.
					</span>
				</label>

				<label class="flex w-full gap-4 cursor-pointer">
					<Checkbox
						bind:checked={agreed3}
						class="!bg-white !text-pls-blue-100 focus:!ring-pls-blue-100 checked:!bg-pls-blue-100"
					/>
					<span class="text-gray-700 text-sm">
						If someone has access to your secret key, they can impersonate your PLS identity and potentially steal your
						Bitcoin.
					</span>
				</label>
				<Button
					disabled={!agreed1 || !agreed2 || !agreed3}
					color="none"
					class="bg-pls-blue-100 text-white mt-4"
					on:click={() => (fullyAgreed = true)}
				>
					Continue
				</Button>
			</div>
		</div>
	</div>
{/if}
