<script lang="ts">
	export let variant: 'surface' | 'elevated' | 'outline' = 'surface';
	export let padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
	export let as: 'div' | 'section' | 'article' = 'div';

	const variants: Record<string, string> = {
		surface: 'bg-[rgb(var(--surface))] border border-[rgb(var(--border))] backdrop-blur-xl',
		elevated:
			'bg-[rgb(var(--surface))] border border-[rgb(var(--border))] backdrop-blur-xl shadow-glow-lg',
		outline: 'bg-transparent border border-[rgb(var(--border-strong))]'
	};

	const paddings: Record<string, string> = {
		none: '',
		sm: 'p-4',
		md: 'p-6 md:p-8',
		lg: 'p-8 md:p-12'
	};

	let classes = '';
	export { classes as class };
</script>

<svelte:element
	this={as}
	class={`rounded-2xl ${variants[variant]} ${paddings[padding]} ${classes}`}
>
	<slot />
</svelte:element>
