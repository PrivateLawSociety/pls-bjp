<script lang="ts">
	import { theme } from '$lib/theme';
</script>

<button
	type="button"
	title={$theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-label="Toggle theme"
	on:click={() => theme.toggle()}
	class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] transition-all hover:border-pls-blue-400 hover:text-pls-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pls-blue-500"
>
	{#if $theme === 'dark'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
			/>
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{/if}
</button>
