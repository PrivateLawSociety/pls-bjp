<script lang="ts">
	import { nostrAuth } from '$lib/wot/nostr';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import LoginPerson from '$lib/components/LoginPerson.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col items-center gap-12 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Rede de Confiança</Badge>
		<h1
			class="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))] md:text-5xl"
		>
			Confiança quantificada
			<span class="text-gradient-brand">no Nostr</span>
		</h1>
		<p class="max-w-xl text-base text-[rgb(var(--text-muted))] md:text-lg">
			Construa uma reputação portátil avaliando pessoas com quem você transacionou e veja em quem a
			rede confia por meio de um grafo vivo de atestações.
		</p>
		<p class="max-w-3xl text-sm text-[rgb(var(--text-muted))] md:text-base">
			A Web of Trust (WoT) é uma camada descentralizada de reputação construída sobre o Nostr. Ela
			permite que pessoas expressem confiança por meio de endossos, criando sinais sociais e
			econômicos visíveis.
		</p>
	</div>

	<Card class="flex w-full max-w-md flex-col items-center gap-5">
		{#if $nostrAuth?.pubkey}
			<a href="/pt/wot/keys" class="group">
				<LoginPerson divClass="text-[rgb(var(--text))]" pubkey={$nostrAuth.pubkey} />
			</a>
			<Button href="/pt/wot/rate" variant="primary" fullWidth>Avaliar alguém</Button>
		{:else}
			<LoginPerson pubkey="" divClass="text-[rgb(var(--text))]" size={20} />
			<Button href="/pt/wot/login" variant="primary" fullWidth>Entrar com Nostr</Button>
		{/if}
		<div class="grid w-full grid-cols-2 gap-3">
			<Button href="/pt/wot/graph" variant="outline">Ver grafo</Button>
			<Button href="/pt/wot/table" variant="outline">Avaliações</Button>
		</div>
	</Card>
</div>

<SiteFooter />
