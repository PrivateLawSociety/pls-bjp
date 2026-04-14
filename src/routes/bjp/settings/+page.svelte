<script lang="ts">
	import { page } from '$app/state';
	import Card from '$lib/components/Card.svelte';

	const isPortuguese = page.url.pathname.startsWith('/pt/');
</script>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-8">
	<div class="text-center">
		<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]">
			{isPortuguese ? 'Configurações' : 'Settings'}
		</h1>
		<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese ? 'Ajuste sua experiência no BJP.' : 'Fine-tune your BJP experience.'}
		</p>
	</div>

	<Card class="flex flex-col items-center gap-3 text-center">
		<div
			class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--surface-2))] text-pls-blue-400 ring-1 ring-[rgb(var(--border-strong))]"
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
				<circle cx="12" cy="12" r="3" />
				<path
					d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
				/>
			</svg>
		</div>
		<h2 class="text-lg font-semibold text-[rgb(var(--text))]">
			{isPortuguese ? 'Em breve' : 'Coming soon'}
		</h2>
		<p class="max-w-sm text-sm text-[rgb(var(--text-muted))]">
			{isPortuguese
				? 'Idioma, notificações e preferências de relay ficarão aqui.'
				: 'Language, notifications, and relay preferences will live here.'}
		</p>
	</Card>
</div>
