<script lang="ts">
	type Type = $$Generic<'text' | 'number'>;
	export let type: Type;
	export let label: string;
	export let value: Type extends 'text' ? string : number;
	export let placeholder = '';
	export let hint = '';
</script>

<label class="flex flex-col gap-2 text-sm">
	<span class="font-medium text-[rgb(var(--text-muted))]">{label}</span>
	{#if type == 'text'}
		<input
			class="w-full rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-4 py-3 text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
			type="text"
			{placeholder}
			bind:value
		/>
	{:else if type == 'number'}
		<input
			class="w-full rounded-xl bg-[rgb(var(--surface-2))] border border-[rgb(var(--border))] px-4 py-3 text-[rgb(var(--text))] placeholder:text-[rgb(var(--text-faint))] outline-none transition-colors focus:border-pls-blue-400 focus:ring-2 focus:ring-pls-blue-400/25"
			type="number"
			{placeholder}
			bind:value
		/>
	{/if}
	{#if hint}
		<span class="text-xs text-[rgb(var(--text-faint))]">{hint}</span>
	{/if}
</label>
