<script lang="ts">
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import type { UnsignedContract } from 'pls-full';
	import { contractDataFileStore } from '$lib/stores';
	import qrcode from 'qrcode-generator';
	import { getNetworkByName } from '$lib/bitcoin';

	let contractData: UnsignedContract | null = null;
	let showToast = false;

	if ($contractDataFileStore) onContractDataFileSelected($contractDataFileStore);

	async function onContractDataFileSelected(file: File) {
		contractData = tryParseFinishedContract(await file.text());
	}

	function qrToImgTag(str: string) {
		const qr = qrcode(12, 'H');

		qr.addData(str);
		qr.make();

		return qr.createDataURL();
	}

	async function copyAddress() {
		if (!contractData?.collateral.multisigAddress) return;

		await navigator.clipboard.writeText(contractData.collateral.multisigAddress);
	}
</script>

<div class="flex flex-col justify-center items-center min-h-screen w-full p-4">
	{#if contractData?.collateral.multisigAddress}
		{@const addressUrl =
			(getNetworkByName(contractData?.collateral.network).isLiquid
				? 'liquidnetwork:'
				: 'bitcoin:') + contractData.collateral.multisigAddress}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full flex flex-col items-center gap-6">
			<h1 class="text-3xl font-bold text-pls-blue-100 text-center">Deposit collateral to multisig</h1>

			<a class="w-full max-w-md aspect-square" href={addressUrl}>
				<img class="w-full h-full object-contain" src={qrToImgTag(addressUrl)} alt="QR Code for deposit address" />
			</a>

			<div class="w-full bg-gray-50 rounded-lg p-4 border border-gray-200">
				<p class="text-sm text-gray-600 mb-2 font-semibold">Multisig Address:</p>
				<p class="break-all text-pls-blue-100 font-mono text-sm">{contractData.collateral.multisigAddress}</p>
			</div>

			<button
				on:click={copyAddress}
				class="bg-pls-blue-100 hover:bg-pls-blue-50 text-white rounded px-6 py-3 text-lg transition-colors w-full max-w-xs"
			>
				Copy Address
			</button>
		</div>
	{:else}
		<div class="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
			<p class="text-xl text-gray-600">No contract data loaded</p>
			<p class="text-sm text-gray-500 mt-2">Please load a contract file first</p>
		</div>
	{/if}
</div>

<style>
    img {
        image-rendering: pixelated;
    }
</style>
