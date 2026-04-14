<script lang="ts">
	import { page } from '$app/state';
	import { Radio } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { NewContractData } from '../shared';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	let newContract = getContext<Writable<NewContractData>>('contract');

	let networkName = $newContract.network ?? 'bitcoin_testnet';
	$: $newContract.network = networkName;

	const networks = [
		{
			value: 'bitcoin',
			label: 'Bitcoin',
			description: 'Bitcoin mainnet — real BTC transactions.'
		},
		{
			value: 'bitcoin_testnet',
			label: 'Bitcoin Testnet',
			description: 'Test network for Bitcoin — free test coins.'
		},
		{
			value: 'liquid',
			label: 'Liquid',
			description: 'Liquid mainnet — real L-BTC transactions.'
		},
		{
			value: 'liquid_testnet',
			label: 'Liquid Testnet',
			description: 'Test network for Liquid — free test coins.'
		}
	];

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const nextPath = isPortuguese ? '/pt/bjp/contract/create/2' : '/bjp/contract/create/2';
</script>

<Card class="flex flex-col gap-6">
	<h2 class="text-xl font-bold text-[rgb(var(--text))]">
		{isPortuguese ? 'Selecione a rede' : 'Select network'}
	</h2>

	<div class="flex flex-col gap-3">
		{#each networks as network}
			{@const active = networkName === network.value}
			<label
				class={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all
					${
						active
							? 'border-pls-blue-400 bg-pls-blue-500/10'
							: 'border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-pls-blue-400'
					}
				`}
			>
				<Radio
					color="primary"
					class="mt-0.5 !bg-[rgb(var(--surface))] focus:!ring-pls-blue-500/25 checked:!bg-pls-blue-500"
					bind:group={networkName}
					value={network.value}
				/>
				<div class="flex-1">
					<p class="text-sm font-semibold text-[rgb(var(--text))]">{network.label}</p>
					<p class="mt-0.5 text-xs text-[rgb(var(--text-muted))]">
						{isPortuguese
							? network.value === 'bitcoin'
								? 'Bitcoin mainnet — transações reais em BTC.'
								: network.value === 'bitcoin_testnet'
									? 'Rede de testes do Bitcoin — moedas de teste gratuitas.'
									: network.value === 'liquid'
										? 'Liquid mainnet — transações reais em L-BTC.'
										: 'Rede de testes da Liquid — moedas de teste gratuitas.'
							: network.description}
					</p>
				</div>
			</label>
		{/each}
	</div>

	{#if !networkName.includes('testnet')}
		<div
			class="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-400"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mt-0.5 flex-none"
			>
				<path
					d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				/>
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
			<div>
				<p class="font-bold">{isPortuguese ? 'Software alpha' : 'Alpha software'}</p>
				<p class="mt-0.5 text-xs">
					{isPortuguese
						? 'Você pode perder seus bitcoins. Use por sua conta e risco.'
						: 'You may lose your bitcoins. Use at your own risk.'}
				</p>
			</div>
		</div>
	{/if}

	<div class="flex justify-end">
		<Button href={nextPath} variant="primary">{isPortuguese ? 'Próximo →' : 'Next →'}</Button>
	</div>
</Card>
