<script lang="ts">
	import { page } from '$app/stores';
	import FileDrop from '$lib/components/FileDrop.svelte';
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import { contractDataFileStore } from '$lib/stores';
	import type { Contract } from 'pls-full';

	let files: FileList | null = null;
	export let contractData: Contract | null = null;
	export let file: File | null = null;

	export let onSelected = () => {};

	$: isPortuguese = $page.url.pathname === '/pt' || $page.url.pathname.startsWith('/pt/');

	$: file = $contractDataFileStore;

	$: if (files && $contractDataFileStore) onSelected();

	$: {
		const newFile = files?.item(0);

		if (newFile) {
			file = newFile;
			onContractDataFileSelected();
		}
	}

	async function onContractDataFileSelected() {
		if (!file) return;

		contractData = tryParseFinishedContract(await file.text());
		$contractDataFileStore = file;

		if (!contractData) {
			$contractDataFileStore = null;
			return alert(
				isPortuguese
					? 'Contrato inválido. Não confunda o Agreement Proof (.json) com o texto do contrato (.txt, .pdf, .docx etc.).'
					: 'Contract is invalid. Do not confuse the Agreement Proof (.json) with the Contract Text (.txt, .pdf, .docx etc.)'
			);
		}
	}
</script>

<FileDrop
	dropText={isPortuguese
		? 'Solte aqui seu JSON Agreement Proof'
		: 'Drop your Agreement Proof JSON here'}
	bind:files
/>
