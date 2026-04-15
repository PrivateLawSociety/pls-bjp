<script lang="ts">
	export let disabled = false;
	export let variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' = 'primary';
	export let size: 'sm' | 'md' | 'lg' = 'md';
	export let type: 'button' | 'submit' | 'reset' = 'button';
	export let href: string | null = null;
	export let target: string | null = null;
	export let rel: string | null = null;
	export let fullWidth = false;
	export let loading = false;

	let extraClass = '';
	export { extraClass as class };

	const base =
		'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-pls-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

	const sizes: Record<string, string> = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-5 py-2.5 text-[15px]',
		lg: 'px-7 py-3.5 text-base'
	};

	const variants: Record<string, string> = {
		primary:
			'bg-gradient-brand text-white shadow-glow hover:brightness-110 hover:-translate-y-px active:translate-y-0',
		secondary:
			'bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] border border-[rgb(var(--border-strong))] hover:border-pls-blue-400 hover:text-pls-blue-400',
		outline:
			'bg-transparent text-[rgb(var(--text))] border border-[rgb(var(--border-strong))] hover:border-pls-blue-400 hover:text-pls-blue-400',
		ghost:
			'bg-transparent text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--surface-2))]',
		danger:
			'bg-red-500/90 text-white hover:bg-red-500 shadow-[0_10px_30px_-12px_rgba(239,68,68,0.45)]'
	};

	$: classes = [base, sizes[size], variants[variant], fullWidth ? 'w-full' : '', extraClass]
		.filter(Boolean)
		.join(' ');

	function handleAnchorClick(event: MouseEvent) {
		if (!disabled && !loading) return;

		event.preventDefault();
		event.stopPropagation();
		// Prevent forwarded on:click handler from running when disabled.
		event.stopImmediatePropagation();
	}

	function handleAnchorKeydown(event: KeyboardEvent) {
		if (!disabled && !loading) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();
	}
</script>

{#if href}
	<a
		href={disabled || loading ? undefined : href}
		{target}
		{rel}
		class={classes}
		aria-disabled={disabled || loading}
		tabindex={disabled || loading ? -1 : 0}
		on:click={handleAnchorClick}
		on:click
		on:keydown={handleAnchorKeydown}
		on:keydown
	>
		{#if loading}
			<span
				class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
			></span>
		{/if}
		<slot />
	</a>
{:else}
	<button {type} disabled={disabled || loading} on:click class={classes}>
		{#if loading}
			<span
				class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
			></span>
		{/if}
		<slot />
	</button>
{/if}
