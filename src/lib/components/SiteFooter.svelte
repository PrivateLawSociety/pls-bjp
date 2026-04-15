<script lang="ts">
	import { page } from '$app/stores';
	import { getLocaleFromPathname } from '$lib/i18n/site';

	$: locale = getLocaleFromPathname($page.url.pathname);

	const socials = [
		{
			label: { en: 'Discord', pt: 'Discord' },
			href: 'https://discord.gg/PNE3PZTUNz'
		},
		{
			label: { en: 'X (Twitter)', pt: 'X (Twitter)' },
			href: 'https://twitter.com/PrivateLawSoc'
		},
		{
			label: { en: 'YouTube', pt: 'YouTube' },
			href: 'https://www.youtube.com/@privatelawsociety'
		},
		{
			label: { en: 'Telegram', pt: 'Telegram' },
			href: 'https://t.me/privatelawsoc'
		},
		{
			label: { en: 'Instagram', pt: 'Instagram' },
			href: 'https://www.instagram.com/privatelawsociety'
		},
		{
			label: { en: 'GitHub', pt: 'GitHub' },
			href: 'https://github.com/PrivateLawSociety/'
		},
		{
			label: { en: 'Nostr', pt: 'Nostr' },
			href: 'https://njump.me/npub1p79dx59d5gctllar73cqnucqft89gpkfmydxj4mmk2jj69s7hn3sfjatxx'
		},
		{
			label: { en: 'Email', pt: 'Email' },
			href: 'mailto:privatelawsociety.net@gmail.com'
		}
	];
</script>

<footer class="border-t border-[rgb(var(--border))]">
	<div
		class="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-12 text-[rgb(var(--text-muted))] md:px-8"
	>
		<div class="flex items-center gap-3">
			<img src="/logo.svg" class="h-8" alt="PLS Logo" />
		</div>

		<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
			{#each socials as s}
				<a
					href={s.href}
					target={s.href.startsWith('http') ? '_blank' : undefined}
					rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
					class="transition-colors hover:text-pls-blue-400"
				>
					{s.label[locale]}
				</a>
			{/each}
		</div>

		<p class="text-xs text-[rgb(var(--text-faint))]">
			{locale === 'pt'
				? 'Um sistema descentralizado de justiça. Voluntário. Reforçado por criptografia.'
				: 'A decentralized system of justice. Voluntary. Cryptographically enforced.'}
		</p>
	</div>
</footer>
