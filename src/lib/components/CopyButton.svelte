<script lang="ts">
	import { onDestroy } from 'svelte';

	export let value: string;
	export let label = 'Copy';
	export let successLabel = 'Copied';
	export let variant: 'primary' | 'ghost' | 'icon' = 'ghost';
	export let title = 'Copy to clipboard';

	let copied = false;
	let timer: ReturnType<typeof setTimeout> | null = null;

	async function copy() {
		try {
			await navigator.clipboard.writeText(value ?? '');
			copied = true;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1800);
		} catch {
			/* ignore */
		}
	}

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});

	const base =
		'inline-flex items-center gap-2 font-medium rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pls-blue-500';
	const variants: Record<string, string> = {
		primary: 'bg-gradient-brand text-white px-4 py-2.5 text-sm shadow-glow hover:brightness-110',
		ghost:
			'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] border border-[rgb(var(--border))] px-3 py-1.5 text-xs hover:text-pls-blue-400 hover:border-pls-blue-400',
		icon: 'bg-transparent text-[rgb(var(--text-muted))] p-2 hover:text-pls-blue-400'
	};
</script>

<button {title} class={`${base} ${variants[variant]}`} on:click={copy} type="button">
	{#if copied}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<polyline points="20 6 9 17 4 12" />
		</svg>
		<span>{successLabel}</span>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		</svg>
		<span>{label}</span>
	{/if}
</button>
