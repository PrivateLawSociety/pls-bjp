<script lang="ts">
	import { page } from '$app/stores';
	let isDragging = false;

	export let files: FileList | null;
	export let dropText = 'Drop files here';

	$: file = files?.item(0) ?? null;
	$: isPortuguese = $page.url.pathname === '/pt' || $page.url.pathname.startsWith('/pt/');
	$: helperText = isPortuguese
		? 'Arraste e solte ou clique para selecionar'
		: 'Drag and drop or click to select';

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		files = event.dataTransfer?.files ?? null;
	}
</script>

<label
	for="file-input"
	class={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-all
		${
			isDragging
				? 'border-pls-blue-400 bg-pls-blue-500/10'
				: 'border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] hover:border-pls-blue-400 hover:bg-pls-blue-500/5'
		}
	`}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
>
	<input id="file-input" bind:files type="file" class="hidden" />
	<div
		class={`flex h-12 w-12 items-center justify-center rounded-2xl transition-colors
			${
				isDragging || file
					? 'bg-gradient-brand text-white shadow-glow'
					: 'bg-[rgb(var(--surface))] text-[rgb(var(--text-faint))] ring-1 ring-[rgb(var(--border))] group-hover:text-pls-blue-400'
			}
		`}
	>
		{#if file}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
				<polyline points="14 2 14 8 20 8" />
				<polyline points="20 15 17 18 14 15" transform="rotate(180 17 16.5)" />
			</svg>
		{:else}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="17 8 12 3 7 8" />
				<line x1="12" y1="3" x2="12" y2="15" />
			</svg>
		{/if}
	</div>
	<div class="flex flex-col gap-0.5">
		<span class="text-sm font-semibold text-[rgb(var(--text))]">
			{file ? file.name : dropText}
		</span>
		{#if !file}
			<span class="text-xs text-[rgb(var(--text-faint))]">{helperText}</span>
		{/if}
	</div>
</label>
