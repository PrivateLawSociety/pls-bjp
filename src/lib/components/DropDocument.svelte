<script lang="ts">
	import { page } from '$app/stores';
	import FileDrop from './FileDrop.svelte';

	let myFiles: FileList | null;

	export let file: File | null = null;
	export let onFileSelected = (file: File) => {};
	$: isPortuguese = $page.url.pathname === '/pt' || $page.url.pathname.startsWith('/pt/');

	$: {
		const newFile = myFiles?.item(0);

		if (newFile) {
			file = newFile;
			onFileSelected(newFile);
		}
	}
</script>

<FileDrop
	dropText={isPortuguese
		? 'Solte aqui o texto do contrato (txt, pdf, word)'
		: 'Drop the contract text here (txt, pdf, word file)'}
	bind:files={myFiles}
/>
