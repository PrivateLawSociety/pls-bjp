<script lang="ts">
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
	import { type Writable, writable } from 'svelte/store';
	import type { NewContractData } from './shared';
	import Stepper from '$lib/components/Stepper.svelte';

	$: isPortuguese = $page.url.pathname.startsWith('/pt/');
	$: steps = isPortuguese
		? ['Rede', 'Clientes', 'Árbitros', 'Documento', 'Revisão']
		: ['Network', 'Clients', 'Arbitrators', 'Document', 'Review'];

	$: step = Number($page.route.id?.split('/').at(-1));

	let newContract = writable({});
	setContext<Writable<NewContractData>>('contract', newContract);
</script>

<div class="mx-auto flex w-full max-w-3xl flex-col gap-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			{isPortuguese ? 'Criar contrato' : 'Create contract'}
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Escolha a rede, as partes e o documento que você quer executar.'
				: 'Pick a network, parties, and the document you want to enforce.'}
		</p>
	</div>

	{#if step}
		<Stepper {steps} current={step} />
	{/if}

	<slot />
</div>
