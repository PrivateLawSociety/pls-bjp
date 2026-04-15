<script lang="ts">
	export let variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'pending' = 'neutral';
	export let size: 'sm' | 'md' = 'sm';

	const variants: Record<string, string> = {
		neutral: 'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] border-[rgb(var(--border))]',
		success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
		warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
		danger: 'bg-red-500/10 text-red-400 border-red-500/30',
		info: 'bg-pls-blue-500/10 text-pls-blue-400 border-pls-blue-500/30',
		pending:
			'bg-[rgb(var(--surface-2))] text-[rgb(var(--text-faint))] border-dashed border-[rgb(var(--border-strong))]'
	};

	const sizes: Record<string, string> = {
		sm: 'px-2 py-0.5 text-[11px]',
		md: 'px-2.5 py-1 text-xs'
	};
</script>

<span
	class={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide ${variants[variant]} ${sizes[size]}`}
>
	<slot />
</span>
