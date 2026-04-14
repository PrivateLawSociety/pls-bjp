<script lang="ts">
	import '../app.css';
	import { getLocaleFromPathname, getTopLevelLocalizedPath } from '$lib/i18n/site';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { theme } from '$lib/theme';
	import { nostrAuth, people } from '$lib/auth';
	import { nip19 } from 'nostr-tools';

	let mobileOpen = false;

	onMount(() => {
		theme.init();
	});

	$: if ($nostrAuth?.pubkey) {
		people.fetchPerson($nostrAuth.pubkey);
	}

	$: profile = $nostrAuth?.pubkey ? $people[$nostrAuth.pubkey] : undefined;
	$: displayName = profile?.name || ($nostrAuth?.pubkey ? shortNpub($nostrAuth.pubkey) : '');
	$: identityPath = locale === 'pt' ? '/pt/wot/keys' : '/wot/keys';
	$: identityLabel =
		locale === 'pt'
			? $nostrAuth?.pubkey
				? 'Minha identidade'
				: 'Entrar'
			: $nostrAuth?.pubkey
				? 'My identity'
				: 'Sign in';
	$: loginPath = locale === 'pt' ? '/pt/wot/login' : '/wot/login';

	function shortNpub(pubkey: string) {
		try {
			const npub = nip19.npubEncode(pubkey);
			return `${npub.slice(0, 10)}…${npub.slice(-4)}`;
		} catch {
			return '';
		}
	}

	function closeDrawer() {
		mobileOpen = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && mobileOpen) closeDrawer();
	}

	$: locale = getLocaleFromPathname($page.url.pathname);
	$: navLinks =
		locale === 'pt'
			? [
					{ href: '/pt', label: 'Início', external: false },
					{ href: '/pt/bjp', label: 'Protocolo de Justiça BTC', external: false },
					{ href: '/pt/wot', label: 'Rede de Confiança', external: false },
					{ href: '/pt/manifesto', label: 'Manifesto', external: false }
				]
			: [
					{ href: '/', label: 'Home', external: false },
					{ href: '/bjp', label: 'BTC Justice Protocol', external: false },
					{ href: '/wot', label: 'Web of Trust', external: false },
					{ href: '/manifesto', label: 'Manifesto', external: false }
				];

	$: englishPath = getTopLevelLocalizedPath($page.url.pathname, 'en');
	$: portuguesePath = getTopLevelLocalizedPath($page.url.pathname, 'pt');

	$: siteTitle =
		locale === 'pt'
			? 'Private Law Society — Justiça pós-Estado'
			: 'Private Law Society — Post-state justice';
	$: siteDescription =
		locale === 'pt'
			? 'Protocolo de Justiça BTC e Rede de Confiança — contratos descentralizados e reputação portátil sobre Bitcoin e Nostr.'
			: 'BTC Justice Protocol and Web of Trust — decentralized contracts and portable reputation on Bitcoin and Nostr.';
</script>

<svelte:head>
	<title>{siteTitle}</title>
	<meta name="description" content={siteDescription} />
</svelte:head>

<svelte:window on:keydown={onWindowKeydown} />

<div class="flex min-h-screen flex-col">
	<header
		class="sticky top-0 z-40 border-b border-[rgb(var(--border-strong))] bg-[rgb(var(--bg))]/90 backdrop-blur-xl supports-[backdrop-filter]:bg-[rgb(var(--bg))]/80"
	>
		<div
			class="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 md:px-8 md:py-4"
		>
			<a href="/" class="flex flex-none items-center">
				<img src="/logo.svg" class="h-8 md:h-9" alt="PLS Logo" />
			</a>

			<nav class="hidden md:flex items-center gap-1">
				{#each navLinks as link}
					{@const isActive = !link.external && $page.url.pathname === link.href}
					<a
						href={link.href}
						target={link.external ? '_blank' : undefined}
						rel={link.external ? 'noopener noreferrer' : undefined}
						class={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-[rgb(var(--surface-2))] hover:text-pls-blue-400
							${isActive ? 'text-[rgb(var(--text))]' : 'text-[rgb(var(--text))]/80'}
						`}
					>
						{link.label}{link.external ? ' ↗' : ''}
					</a>
				{/each}
			</nav>

			<div class="hidden md:flex flex-none items-center gap-2">
				<div
					class="flex items-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-1 text-xs font-semibold"
				>
					<a
						href={englishPath}
						class={`rounded-lg px-2.5 py-1 transition-colors ${locale === 'en' ? 'bg-[rgb(var(--surface))] text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))] hover:text-pls-blue-400'}`}
					>
						English
					</a>
					<a
						href={portuguesePath}
						class={`rounded-lg px-2.5 py-1 transition-colors ${locale === 'pt' ? 'bg-[rgb(var(--surface))] text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))] hover:text-pls-blue-400'}`}
					>
						Português
					</a>
				</div>
				<ThemeToggle />
				{#if $nostrAuth?.pubkey}
					<a
						href={identityPath}
						title={displayName}
						aria-label={identityLabel}
						class="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-2 py-1 text-xs font-semibold text-[rgb(var(--text))] transition-colors hover:border-pls-blue-400 hover:text-pls-blue-400"
					>
						{#if profile?.picture}
							<img
								src={profile.picture}
								alt=""
								class="h-7 w-7 rounded-full object-cover ring-1 ring-[rgb(var(--border-strong))]"
								on:error={(e) => ((e.currentTarget as HTMLImageElement).src = '/avatar.svg')}
							/>
						{:else}
							<div
								class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-bold uppercase text-white ring-1 ring-[rgb(var(--border-strong))]"
							>
								{(profile?.name || '?').slice(0, 1)}
							</div>
						{/if}
						<span class="max-w-28 truncate">{displayName}</span>
					</a>
				{:else}
					<a
						href={loginPath}
						aria-label={identityLabel}
						class="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))] transition-colors hover:border-pls-blue-400 hover:text-pls-blue-400"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
							<polyline points="10 17 15 12 10 7" />
							<line x1="15" y1="12" x2="3" y2="12" />
						</svg>
						{identityLabel}
					</a>
				{/if}
			</div>

			<div class="flex items-center gap-2 md:hidden">
				{#if $nostrAuth?.pubkey}
					<a
						href={identityPath}
						title={displayName}
						aria-label={identityLabel}
						class="flex h-9 items-center gap-1.5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] pl-1 pr-2 text-xs font-semibold text-[rgb(var(--text))] transition-colors hover:border-pls-blue-400"
					>
						{#if profile?.picture}
							<img
								src={profile.picture}
								alt=""
								class="h-7 w-7 rounded-full object-cover ring-1 ring-[rgb(var(--border-strong))]"
								on:error={(e) => ((e.currentTarget as HTMLImageElement).src = '/avatar.svg')}
							/>
						{:else}
							<div
								class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-[10px] font-bold uppercase text-white ring-1 ring-[rgb(var(--border-strong))]"
							>
								{(profile?.name || '?').slice(0, 1)}
							</div>
						{/if}
					</a>
				{/if}
				<ThemeToggle />
				<button
					on:click={() => (mobileOpen = !mobileOpen)}
					class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text-muted))] transition-all hover:border-pls-blue-400 hover:text-pls-blue-400"
					aria-label="Open menu"
				>
					{#if mobileOpen}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					{/if}
				</button>
			</div>
		</div>
	</header>

	{#if mobileOpen}
		<div class="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
			<button
				transition:fade={{ duration: 150 }}
				type="button"
				class="absolute inset-0 bg-black/60 backdrop-blur-sm"
				on:click={closeDrawer}
				aria-label="Close menu"
			></button>
			<aside
				transition:fly={{ x: 320, duration: 220 }}
				class="absolute right-0 top-0 h-full w-72 max-w-[80vw] border-l border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-6 shadow-2xl"
			>
				<div class="mb-8 flex items-center justify-between">
					<img src="/logo.svg" class="h-8" alt="PLS Logo" />
					<button
						on:click={closeDrawer}
						class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[rgb(var(--text-muted))] hover:text-pls-blue-400"
						aria-label="Close menu"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
				<nav class="flex flex-col gap-4">
					<div
						class="mb-2 flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-1 text-sm font-medium"
					>
						<a
							href={englishPath}
							on:click={closeDrawer}
							class={`flex-1 rounded-lg px-3 py-2 text-center transition-colors ${locale === 'en' ? 'bg-[rgb(var(--surface))] text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))]'}`}
						>
							English
						</a>
						<a
							href={portuguesePath}
							on:click={closeDrawer}
							class={`flex-1 rounded-lg px-3 py-2 text-center transition-colors ${locale === 'pt' ? 'bg-[rgb(var(--surface))] text-[rgb(var(--text))]' : 'text-[rgb(var(--text-muted))]'}`}
						>
							Português
						</a>
					</div>
					{#each navLinks as link}
						<a
							href={link.href}
							target={link.external ? '_blank' : undefined}
							rel={link.external ? 'noopener noreferrer' : undefined}
							on:click={closeDrawer}
							class="text-base font-medium text-[rgb(var(--text))] hover:text-pls-blue-400"
						>
							{link.label}{link.external ? ' ↗' : ''}
						</a>
					{/each}
				</nav>
			</aside>
		</div>
	{/if}

	<main class="flex-1">
		<slot />
	</main>
</div>
