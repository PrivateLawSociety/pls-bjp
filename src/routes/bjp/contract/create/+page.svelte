<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { page } from '$app/state';

	const basePath = page.url.pathname.startsWith('/pt/')
		? '/pt/bjp/contract/create'
		: '/bjp/contract/create';
</script>

<Card class="flex flex-col gap-5">
	<ul class="flex flex-col gap-3 text-sm text-[rgb(var(--text-muted))]">
		<li class="flex items-start gap-3">
			<span class="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gradient-brand"></span>
			{page.url.pathname.startsWith('/pt/')
				? 'Apenas uma das partes envolvidas deve criar o contrato aqui.'
				: 'Only one of the involved parties should create the contract here.'}
		</li>
		<li class="flex items-start gap-3">
			<span class="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-gradient-brand"></span>
			{page.url.pathname.startsWith('/pt/')
				? 'Depois de criado, as outras partes apenas assinam o contrato.'
				: 'Once created, the other involved parties will just sign the contract.'}
		</li>
	</ul>

	<div class="flex justify-end">
		<Button href={`${basePath}/1`} variant="primary">
			{page.url.pathname.startsWith('/pt/') ? 'Próximo' : 'Next'}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="5" y1="12" x2="19" y2="12" />
				<polyline points="12 5 19 12 12 19" />
			</svg>
		</Button>
	</div>
</Card>
