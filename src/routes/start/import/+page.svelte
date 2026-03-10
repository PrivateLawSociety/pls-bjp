<script lang="ts">
	import { ECPair } from '$lib/bitcoin';
	import { nostrAuth } from '$lib/nostr';
	import { Buffer } from 'buffer';
	import { Button, Input, Label, P } from 'flowbite-svelte';
	import { nip19 } from 'nostr-tools';

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
</script>

<div class="flex items-center justify-center min-h-screen p-4">
	<div class="bg-white rounded-lg shadow-md p-6 w-full max-w-lg">
		<div class="flex justify-center mb-4">
			<P size="4xl" class="text-pls-blue-100" weight="bold" color="none">Import PLS Identity</P>
		</div>

		<div class="flex flex-col justify-center items-center gap-4">
			<div class="w-full">
				<Label class="mb-2 text-md text-pls-blue-100" color="none">Insert your nostr secret key here:</Label>
				<div class="w-full flex items-center gap-2">
					<Input class="flex-1 bg-white text-pls-blue-100" color="none" type={showSecret ? 'text' : 'password'}
								 bind:value={nsecInput} />
					<Button type="button" class="bg-pls-blue-50 text-white" color="none"
									on:click={() => (showSecret = !showSecret)}>
						{#if showSecret}Hide{:else}Show{/if}
					</Button>
				</div>
			</div>

			<div class="w-full">
				<a href="/">
					<Button
						class="w-full bg-pls-blue-50 text-white"
						color="none"
						disabled={secretKeyStr == null}
						on:click={() => {
							if (secretKeyStr) nostrAuth.loginWithPrivkey(secretKeyStr);
						}}
					>
						Continue
					</Button>
				</a>
			</div>
		</div>
	</div>
</div>
