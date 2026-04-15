<script lang="ts">
	export let steps: string[];
	export let current: number = 1;
</script>

<div class="w-full">
	<ol class="flex items-center gap-2 md:gap-4">
		{#each steps as label, i}
			{@const n = i + 1}
			{@const state = n < current ? 'done' : n === current ? 'active' : 'upcoming'}
			<li class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
				<div class="flex items-center gap-3 min-w-0">
					<div
						class={`relative flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold transition-all
							${state === 'done' ? 'bg-gradient-brand text-white shadow-glow' : ''}
							${
								state === 'active'
									? 'bg-[rgb(var(--surface-2))] border-2 border-pls-blue-400 text-pls-blue-400 ring-4 ring-pls-blue-500/20'
									: ''
							}
							${
								state === 'upcoming'
									? 'bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] text-[rgb(var(--text-faint))]'
									: ''
							}
						`}
					>
						{#if state === 'done'}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
						{:else}
							{n}
						{/if}
					</div>
					<span
						class={`hidden md:inline truncate text-sm font-medium transition-colors
							${state === 'active' ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--text-faint))]'}
						`}
					>
						{label}
					</span>
				</div>
				{#if i < steps.length - 1}
					<div class="flex-1 h-px rounded-full bg-[rgb(var(--border))] relative overflow-hidden">
						<div
							class={`absolute inset-y-0 left-0 transition-all duration-500 ${
								n < current ? 'w-full bg-gradient-brand' : 'w-0'
							}`}
						></div>
					</div>
				{/if}
			</li>
		{/each}
	</ol>
</div>
