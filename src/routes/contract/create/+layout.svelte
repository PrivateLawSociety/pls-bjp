<script lang="ts">
	import { page } from '$app/stores';
	import { P } from 'flowbite-svelte';
	import { setContext } from 'svelte';
	import { type Writable, writable } from 'svelte/store';
	import type { NewContractData } from './shared';

	$: step = Number($page.route.id?.split('/').at(-1));

	let newContract = writable({});

	setContext<Writable<NewContractData>>('contract', newContract);
</script>

<div class="flex flex-col justify-center items-center h-full m-8 mt-0">
	<div class="flex flex-col justify-center items-center w-full max-w-4xl">
		<P size="3xl" weight="bold" class="text-pls-blue-100 mb-6">Create Contract</P>

		{#if step}
			<!-- Progress Bar -->
			<div class="w-full mb-8">
				<div class="flex justify-between items-center mb-2">
					{#each Array(5) as _, i}
						<div class="flex flex-col items-center flex-1">
							<!-- Step Circle -->
							<div
								class={`
									w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
									transition-colors duration-300
									${i + 1 < step ? 'bg-pls-blue-100 text-white' : ''}
									${i + 1 === step ? 'bg-pls-blue-50 text-white ring-4 ring-pls-blue-50 ring-opacity-30' : ''}
									${i + 1 > step ? 'bg-gray-200 text-gray-500' : ''}
								`}
							>
								{i + 1}
							</div>
							<!-- Step Label -->
							<span
								class={`text-xs mt-2 text-center ${i + 1 === step ? 'text-pls-blue-100 font-semibold' : 'text-gray-500'}`}>
								Step {i + 1}
							</span>
						</div>

						<!-- Connector Line -->
						{#if i < 4}
							<div class="flex-1 h-1 mx-2 -mt-6">
								<div
									class={`
										h-full transition-colors duration-300
										${i + 1 < step ? 'bg-pls-blue-100' : 'bg-gray-200'}
									`}
								/>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<slot />
</div>
