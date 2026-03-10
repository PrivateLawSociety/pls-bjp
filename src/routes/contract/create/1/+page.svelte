<script lang="ts">
	import { Button, Radio } from 'flowbite-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { NewContractData } from '../shared';

	let newContract = getContext<Writable<NewContractData>>('contract');

	let networkName = $newContract.network ?? 'bitcoin_testnet';

	$: $newContract.network = networkName;

	const networks = [
		{
			value: 'bitcoin',
			label: 'Bitcoin',
			description: 'Bitcoin mainnet - Real BTC transactions'
		},
		{
			value: 'bitcoin_testnet',
			label: 'Bitcoin Testnet',
			description: 'Test network for Bitcoin - Free test coins'
		},
		{
			value: 'liquid',
			label: 'Liquid',
			description: 'Liquid mainnet - Real L-BTC transactions'
		},
		{
			value: 'liquid_testnet',
			label: 'Liquid Testnet',
			description: 'Test network for Liquid - Free test coins'
		}
	];
</script>

<div class="flex items-center justify-center min-h-[calc(100vh-300px)] w-full p-4">
	<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
		<h2 class="text-2xl font-bold text-pls-blue-100 text-center mb-6">Select Network</h2>

		<div class="space-y-3 mb-6">
			{#each networks as network}
				<div
					class={`
						block p-4 rounded-lg border-2 cursor-pointer transition-colors
						${networkName === network.value ? 'border-pls-blue-100 bg-pls-blue-50 bg-opacity-10' : 'border-gray-200 hover:border-pls-blue-50'}
					`}
				>
					<label class="flex items-start cursor-pointer">
						<Radio
							color="none"
							class="mt-1 flex-shrink-0"
							bind:group={networkName}
							value={network.value}
						/>
						<span class="ml-3 flex-1">
							<span class="block font-semibold text-pls-blue-100">{network.label}</span>
							<span class="block text-sm text-gray-600 mt-1">{network.description}</span>
						</span>
					</label>
				</div>
			{/each}
		</div>

		{#if !networkName.includes('testnet')}
			<div class="bg-red-500 text-white font-bold text-center p-4 rounded-lg mb-6">
				☣️ ALPHA SOFTWARE. You may lose your bitcoins. Use at your own risk.
			</div>
		{/if}

		<div class="flex justify-center">
			<a href="/contract/create/2" class="w-full">
				<Button
					color="none"
					class="bg-white w-full text-pls-blue-100 border-2 border-pls-blue-100 hover:bg-pls-blue-50 hover:text-white transition-colors px-8 py-2">
					Next
				</Button>
			</a>
		</div>
	</div>
</div>
