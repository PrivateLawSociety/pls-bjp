<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { ReviewEvent } from '$lib/wot/index';

	import { getPublicKey } from 'nostr-tools/pure';
	import { broadcastToNostr, nostrAuth } from '$lib/wot/nostr';
	import { decode, npubEncode } from 'nostr-tools/nip19';
	import { goto } from '$app/navigation';
	import { Input, Label, Radio, Textarea } from 'flowbite-svelte';

	import { page } from '$app/state';

	const npub = page.url.searchParams.get('npub');

	function parsePubKey(str: string) {
		try {
			const nip19 = decode(str);

			if (nip19.type == 'npub') return hexStringToBuffer(nip19.data);
		} catch {
			try {
				const buf = hexStringToBuffer(str);

				if (buf.length !== 32) return;

				return buf;
			} catch {}
		}
	}

	function hexStringToBuffer(str: string) {
		return Uint8Array.from(toHex(str));
	}

	function toHex(hexString: string) {
		let hex = [];

		let i = 0;
		while (i < hexString.length) {
			hex[i / 2] = parseInt(hexString[i] + hexString[i + 1], 16);

			i += 2;
		}

		return hex;
	}

	function numberToHex(i: number) {
		return ('0' + i.toString(16)).slice(-2);
	}

	function bufToHexString(buf: Uint8Array) {
		return buf.reduce((memo, i) => memo + numberToHex(i), '');
	}

	interface Review {
		from: string;
		to: string;
		score: boolean;
		businessAlreadyDone: boolean;
		description: string;
	}

	let otherPersonPubKey = npub ?? '';
	let ratingDescription = '';
	let score: number | undefined;
	let businessAlreadyDone: number | undefined;

	async function handleSubmit() {
		if (ratingDescription.length >= 1000)
			return alert('2000 characters is the max for a rating description');

		if (score == undefined || businessAlreadyDone == undefined)
			return alert('You forgot to fill some checkbox');

		const privkey = nostrAuth.getPrivkey();

		if (privkey) {
			nostrAuth.loginWithPrivkey(privkey);
		}

		if (!nostrAuth) return alert('Invalid secret key');

		const myPubkey = !!nostrAuth
			? nostrAuth.getPubkey()!
			: getPublicKey(Buffer.from(privkey!, 'hex'));

		const otherPubKey = parsePubKey(otherPersonPubKey);
		if (!otherPubKey) return alert('Invalid public key');

		const ratedPubKey = bufToHexString(otherPubKey);
		let rating: Review = {
			from: myPubkey,
			to: ratedPubKey,
			score: Boolean(score),
			businessAlreadyDone: Boolean(businessAlreadyDone),
			description: ratingDescription
		};

		const labelTag = ['l', `pls-wot-rating`];
		const dTag = ['d', `pls-wot-rating-${ratedPubKey}`];
		const event = await nostrAuth.makeEvent(ReviewEvent, JSON.stringify(rating), [labelTag, dTag]);

		// const event = finalizeEvent({
		// 		content: JSON.stringify(rating),
		// 		created_at: Math.floor(Date.now() / 1000),
		// 		kind: ReviewEvent,
		// 		tags: []
		// }, mySecKey)

		// TODO: Sign review, let user download it, and disabled 'send to nostr' button
		// 'send to nostr' should be in a parameterized replaceable event (but just do ephemeral for now)

		// relayPool.publish(relayList, event)
		broadcastToNostr(event);

		if (confirm('Event published. Would you like to see the ratings?')) {
			goto('/wot/table');
		}

		otherPersonPubKey = '';
		ratingDescription = '';
		score = undefined;
		businessAlreadyDone = undefined;
	}

	$: if (!$nostrAuth?.pubkey) {
		let urlParams = npub ? `?npub=${npub}` : '';
		goto(`/wot/login${urlParams}`);
	}
</script>

<form
	on:submit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="mx-auto flex w-full max-w-4xl flex-col gap-8 py-10 md:py-16"
>
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Web of Trust</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			Create Rating
		</h1>
		<p class="max-w-2xl text-sm text-[rgb(var(--text-muted))] md:text-base">
			Publish a trust rating for someone you have transacted with on Nostr.
		</p>
	</div>

	<Card class="mx-auto flex w-full max-w-4xl flex-col gap-6">
		{#if $nostrAuth?.pubkey}
			<div class="flex flex-col gap-2">
				<Label class="pb-1 font-semibold text-[rgb(var(--text))]">Your npub:</Label>
				<pre
					class="whitespace-pre-wrap break-all rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-4 text-sm text-[rgb(var(--text))]">{npubEncode(
						$nostrAuth.pubkey
					)}</pre>
			</div>
		{/if}

		<div class="flex flex-col gap-2">
			<Label class="pb-1 font-semibold text-[rgb(var(--text))]">Other person pubkey:</Label>
			{#if npub}
				<Input
					class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
					bind:value={otherPersonPubKey}
					type="text"
					readonly
				/>
			{:else}
				<Input
					class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
					bind:value={otherPersonPubKey}
					type="text"
				/>
			{/if}
		</div>

		<div class="grid gap-5 lg:grid-cols-2">
			<Card padding="sm" variant="outline" class="flex flex-col gap-3">
				<Label class="pb-1 font-semibold text-[rgb(var(--text))]">
					What rating do you give to this person?
				</Label>
				<div class="flex gap-4">
					<Label class="flex items-center gap-2 text-[rgb(var(--text))]">
						<Radio class="text-pls-blue-500" bind:group={score} value={1} />
						Positive
					</Label>
					<Label class="flex items-center gap-2 text-[rgb(var(--text))]">
						<Radio class="text-pls-blue-500" bind:group={score} value={0} />
						Negative
					</Label>
				</div>
			</Card>

			<Card padding="sm" variant="outline" class="flex flex-col gap-3">
				<Label class="pb-1 font-semibold text-[rgb(var(--text))]">
					Have you ever done business with this person?
				</Label>
				<div class="flex gap-4">
					<Label class="flex items-center gap-2 text-[rgb(var(--text))]">
						<Radio bind:group={businessAlreadyDone} value={1} class="text-pls-blue-500" />
						Yes
					</Label>
					<Label class="flex items-center gap-2 text-[rgb(var(--text))]">
						<Radio bind:group={businessAlreadyDone} value={0} class="text-pls-blue-500" />
						No
					</Label>
				</div>
			</Card>
		</div>

		<div class="flex flex-col gap-2">
			<Label class="pb-1 font-semibold text-[rgb(var(--text))]">Rating description</Label>
			<Textarea
				class="min-h-32 w-full rounded-2xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
				rows={6}
				bind:value={ratingDescription}
			/>
		</div>

		<div class="flex justify-end">
			<Button type="submit" variant="primary" size="lg" class="min-w-56">Create rating</Button>
		</div>
	</Card>
</form>
