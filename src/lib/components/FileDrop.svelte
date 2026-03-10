<script lang="ts">
	let isDragging = false;

	export let files: FileList | null;

	export let dropText = 'Drop files here';

	let dropArea: HTMLLabelElement;

	$: file = files?.item(0) ?? null;

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
		files = event.dataTransfer?.files!;
	}
</script>

<label
	for="file-input"
	class={`
		block
		text-center
		text-gray-500
		font-semibold
		border-2
		border-dashed
		px-8 py-4
		rounded-lg
		transition-colors
		cursor-pointer
		text-pls-blue-50
		font-bold
		hover:bg-pls-blue-50
		hover:text-white
		bg-white
		${isDragging ? 'border-yellow-400' : 'border-gray-300'}
	`}
	on:dragover={handleDragOver}
	on:dragleave={handleDragLeave}
	on:drop={handleDrop}
	bind:this={dropArea}
>
	<input id="file-input" bind:files type="file" class="hidden" />
	<span class="text-lg block">{file ? file.name : dropText}</span>
</label>
