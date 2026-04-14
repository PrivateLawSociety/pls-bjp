<script lang="ts">
	import { page } from '$app/state';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { Dropzone } from 'flowbite-svelte';
	import type { NewContractData } from '../shared';
	import { hashFromFile } from '$lib/utils';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	const newContract = getContext<Writable<NewContractData>>('contract');

	let fileList: FileList | undefined;
	$: file = fileList?.item(0);

	$: if (file) {
		$newContract.fileName = file?.name;
		hashFromFile(file).then((hash) => {
			$newContract.fileHash = hash.toString('hex');
		});
	}

	function dropHandle(e: DragEvent) {
		e.preventDefault();
		const files = e.dataTransfer?.files;
		if (files?.length !== 1)
			return alert(
				page.url.pathname.startsWith('/pt/')
					? 'Solte exatamente um arquivo'
					: 'Drop exactly one file'
			);
		file = files.item(0)!;
	}

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const nextPath = isPortuguese ? '/pt/bjp/contract/create/5' : '/bjp/contract/create/5';
</script>

<Card class="flex flex-col gap-6">
	<div>
		<h2 class="text-xl font-bold text-[rgb(var(--text))]">
			{isPortuguese ? 'Selecione o documento' : 'Select document'}
		</h2>
		<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Envie o arquivo que descreve os termos do acordo.'
				: 'Upload the file that describes the terms of the agreement.'}
		</p>
	</div>

	<Dropzone
		class="flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] p-8 cursor-pointer transition-all hover:border-pls-blue-400 hover:bg-pls-blue-500/5"
		bind:files={fileList}
		onDrop={dropHandle}
		onDragOver={(e) => e.preventDefault()}
	>
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow"
		>
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
		</div>
		{#if $newContract.fileName}
			<p class="text-sm font-semibold text-[rgb(var(--text))]">
				{$newContract.fileName}
			</p>
			<p class="text-xs text-[rgb(var(--text-faint))]">
				{isPortuguese ? 'Clique ou solte para substituir' : 'Click or drop to replace'}
			</p>
		{:else}
			<p class="text-sm font-semibold text-[rgb(var(--text))]">
				{isPortuguese
					? 'Clique para enviar ou arraste e solte'
					: 'Click to upload or drag and drop'}
			</p>
			<p class="text-xs text-[rgb(var(--text-faint))]">
				{isPortuguese
					? '.docx, .pdf, .txt ou qualquer tipo de arquivo'
					: '.docx, .pdf, .txt, or any file type'}
			</p>
		{/if}
	</Dropzone>

	<div class="flex justify-end">
		<Button href={nextPath} variant="primary" disabled={!$newContract.fileHash}>
			{isPortuguese ? 'Próximo →' : 'Next →'}
		</Button>
	</div>
</Card>
