<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	const manifestoEnglishPreview =
		'https://drive.google.com/file/d/1TOvqzWT15z1mLOzmlMHAc_VupPwKBOsh/preview';
	const manifestoPortuguesePreview =
		'https://drive.google.com/file/d/1kB8_eXOSq-1eVTen2J7PEzjemBrr9S3M/preview';
	const manifestoEnglishView =
		'https://drive.google.com/file/d/1TOvqzWT15z1mLOzmlMHAc_VupPwKBOsh/view';
	const manifestoPortugueseView =
		'https://drive.google.com/file/d/1kB8_eXOSq-1eVTen2J7PEzjemBrr9S3M/view';
</script>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-12 py-12 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">Manifesto</Badge>
		<h1
			class="max-w-4xl text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))]"
		>
			Private Law Society,
			<span class="text-gradient-brand">post-state justice</span>
		</h1>
		<p class="max-w-3xl text-base md:text-lg text-[rgb(var(--text-muted))]">
			Read the PLS manifesto directly in the app, with both English and Portuguese versions
			available side by side.
		</p>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card class="flex flex-col gap-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">English</p>
				<h2 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">Private Law Society (PLS)</h2>
				<p class="mt-2 text-[rgb(var(--text-muted))]">
					A Decentralized Justice System for the Post-State Era
				</p>
			</div>
			<div
				class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
			>
				<iframe
					title="PLS Manifesto English"
					src={manifestoEnglishPreview}
					class="h-[640px] w-full"
					loading="lazy"
				></iframe>
			</div>
			<div class="flex flex-wrap gap-3">
				<Button
					href={manifestoEnglishView}
					target="_blank"
					rel="noopener noreferrer"
					variant="primary"
				>
					Open English manifesto
				</Button>
			</div>
		</Card>

		<Card class="flex flex-col gap-5">
			<div>
				<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Português</p>
				<h2 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">Private Law Society (PLS)</h2>
				<p class="mt-2 text-[rgb(var(--text-muted))]">
					Um Sistema Descentralizado de Justiça Para a Era Pós-Estado
				</p>
			</div>
			<div
				class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
			>
				<iframe
					title="PLS Manifesto Portuguese"
					src={manifestoPortuguesePreview}
					class="h-[640px] w-full"
					loading="lazy"
				></iframe>
			</div>
			<div class="flex flex-wrap gap-3">
				<Button
					href={manifestoPortugueseView}
					target="_blank"
					rel="noopener noreferrer"
					variant="secondary"
				>
					Open manifesto em português
				</Button>
			</div>
		</Card>
	</div>
</div>

<SiteFooter />
