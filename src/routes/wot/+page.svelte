<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import LoginPerson from '$lib/components/LoginPerson.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
	import { nostrAuth } from '$lib/wot/nostr';
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Web of Trust</Badge>
		<h1
			class="max-w-2xl text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))]"
		>
			Trust, quantified <span class="text-gradient-brand">on Nostr</span>
		</h1>
		<p class="max-w-xl text-base md:text-lg text-[rgb(var(--text-muted))]">
			Build a portable reputation by rating people you've transacted with, and see who the network
			trusts through a living graph of attestations.
		</p>
		<p class="max-w-3xl text-sm md:text-base text-[rgb(var(--text-muted))]">
			Web of Trust (WoT) is a decentralized reputation layer built on Nostr. It lets people express
			trust through endorsements, creating visible social and economic signals. Reputation emerges
			organically, guiding coordination without central authorities or scores.
		</p>
	</div>

	<Card class="flex w-full max-w-md flex-col items-center gap-5">
		{#if $nostrAuth?.pubkey}
			<a href="/wot/keys" class="group">
				<LoginPerson divClass="text-[rgb(var(--text))]" pubkey={$nostrAuth.pubkey} />
			</a>
			<Button href="/wot/rate" variant="primary" fullWidth>Give rating</Button>
		{:else}
			<LoginPerson pubkey="" divClass="text-[rgb(var(--text))]" size={20} />
			<Button href="/wot/login" variant="primary" fullWidth>Login with Nostr</Button>
		{/if}
		<div class="grid w-full grid-cols-2 gap-3">
			<Button href="/wot/graph" variant="outline">View graph</Button>
			<Button href="/wot/table" variant="outline">Ratings</Button>
		</div>
	</Card>
</div>

<SiteFooter />
