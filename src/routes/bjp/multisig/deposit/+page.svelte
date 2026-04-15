<script lang="ts">
	import { page } from '$app/state';
	import { tryParseFinishedContract } from '$lib/pls/contract';
	import type { UnsignedContract } from 'pls-full';
	import { contractDataFileStore } from '$lib/stores';
	import qrcode from 'qrcode-generator';
	import { getNetworkByName } from '$lib/bitcoin';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let contractData: UnsignedContract | null = null;

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

	const isPortuguese = page.url.pathname.startsWith('/pt/');
	const verifyPath = isPortuguese ? '/pt/bjp/contract/verify' : '/bjp/contract/verify';
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
	{#if contractData?.collateral.multisigAddress}
		{@const addressUrl =
			(getNetworkByName(contractData?.collateral.network).isLiquid
				? 'liquidnetwork:'
				: 'bitcoin:') + contractData.collateral.multisigAddress}

		<div class="text-center">
			<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				{isPortuguese ? 'Depositar garantia' : 'Deposit collateral'}
			</h1>
			<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
				{isPortuguese
					? 'Envie fundos para o endereço multisig abaixo. É a garantia que executa o contrato.'
					: "Send funds to the multisig address below. It's the escrow that enforces the contract."}
			</p>
		</div>

		<Card class="flex flex-col items-center gap-6">
			<a
				href={addressUrl}
				class="block w-full max-w-xs overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-white p-3"
			>
				<img
					class="h-full w-full object-contain"
					src={qrToImgTag(addressUrl)}
					alt={isPortuguese ? 'QR Code do endereço de depósito' : 'QR Code for deposit address'}
				/>
			</a>

			<div class="w-full">
				<p class="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Endereço multisig' : 'Multisig address'}
				</p>
				<div
					class="mt-2 flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
				>
					<p class="flex-1 break-all font-mono text-xs md:text-sm text-[rgb(var(--text))]">
						{contractData.collateral.multisigAddress}
					</p>
					<CopyButton value={contractData.collateral.multisigAddress} />
				</div>
				<p class="mt-2 text-xs text-[rgb(var(--text-faint))]">
					{isPortuguese ? 'Rede:' : 'Network:'}
					<span class="font-semibold text-[rgb(var(--text))]"
						>{contractData.collateral.network}</span
					>
				</p>
			</div>
		</Card>
	{:else}
		<Card class="flex flex-col items-center gap-3 text-center">
			<div
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
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
					<path
						d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
					/>
					<line x1="12" y1="9" x2="12" y2="13" />
					<line x1="12" y1="17" x2="12.01" y2="17" />
				</svg>
			</div>
			<h2 class="text-lg font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Nenhum contrato carregado' : 'No contract loaded'}
			</h2>
			<p class="text-sm text-[rgb(var(--text-muted))]">
				{#if isPortuguese}
					Carregue primeiro um arquivo de contrato em <a
						href={verifyPath}
						class="text-pls-blue-400 hover:underline">{verifyPath}</a
					>.
				{:else}
					Load a contract file from <a href={verifyPath} class="text-pls-blue-400 hover:underline"
						>{verifyPath}</a
					> first.
				{/if}
			</p>
		</Card>
	{/if}
</div>

<style>
	img {
		image-rendering: pixelated;
	}
</style>
