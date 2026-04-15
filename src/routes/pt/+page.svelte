<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	const btcAddress = 'bc1qyyllsn56f5y52ykpz52ah9agjcpfmrz77k9p2t';
	const lightningAddress = 'privatelawsociety@coinos.io';

	type Platform = 'github' | 'x' | 'nostr';

	const team: {
		name: string;
		role: string;
		platform: Platform;
		href: string;
		avatar: string;
	}[] = [
		{
			name: 'Marcus',
			role: 'Desenvolvimento',
			platform: 'github',
			href: 'https://github.com/marcusmmmz',
			avatar: '/avatars/marcus.png'
		},
		{
			name: 'Daniel',
			role: 'Geral',
			platform: 'x',
			href: 'https://x.com/DanielSmithPLS',
			avatar: '/avatars/daniel.jpg'
		},
		{
			name: 'Paipe',
			role: 'Geral',
			platform: 'x',
			href: 'https://x.com/raspaipe',
			avatar: '/avatars/paipe.jpg'
		},
		{
			name: 'Julio',
			role: 'Marketing',
			platform: 'nostr',
			href: 'https://primal.net/p/nprofile1qqs9dlls4z7k54yh8uu7macvupvwgj2a92qzfck278yktq30cteaegsmzyy2h',
			avatar: '/avatars/julio.png'
		},
		{
			name: 'TheMhv',
			role: 'Desenvolvimento',
			platform: 'nostr',
			href: 'https://primal.net/p/nprofile1qqsxgsc2fmunxj5k7p65pr4ryvgedms8x7qt3mj00h9aal90dhnaw2g7d6qyt',
			avatar: '/avatars/themhv.png'
		},
		{
			name: 'Narcelio',
			role: 'Marketing',
			platform: 'x',
			href: 'https://x.com/narcelio',
			avatar: '/avatars/narcelio.jpg'
		},
		{
			name: 'Theus',
			role: 'Geral',
			platform: 'nostr',
			href: 'https://primal.net/p/npub1ejlc0kr3k4qk88d2zm4gv930jqct8sdemnwnq7jsayjgggw9a9sqss54s4',
			avatar: '/avatars/theus.png'
		},
		{
			name: 'Rogerio',
			role: 'Desenvolvimento',
			platform: 'x',
			href: 'https://x.com/RogerioRbf',
			avatar: '/avatars/rogerio.jpg'
		},
		{
			name: 'Weasel',
			role: 'Desenvolvimento',
			platform: 'github',
			href: 'https://github.com/LuizPreve',
			avatar: '/avatars/weasel.png'
		},
		{
			name: 'Calango',
			role: 'Desenvolvimento',
			platform: 'nostr',
			href: 'https://primal.net/p/nprofile1qqsqhzzdphtjcdl7pka550zz90uv6ce0kz7u00j3wj09gkjyn2aa2js5lvaqw',
			avatar: '/avatars/calango.png'
		},
		{
			name: 'Wick',
			role: 'Desenvolvimento',
			platform: 'x',
			href: 'https://x.com/GaltWick',
			avatar: '/avatars/wick.jpg'
		},
		{
			name: 'Owltz',
			role: 'Desenvolvimento',
			platform: 'github',
			href: 'https://github.com/owltz',
			avatar: '/avatars/owltz.png'
		}
	];
</script>

<section class="relative overflow-hidden">
	<div
		class="absolute inset-0 bg-cover bg-center"
		style="background-image: url('/hero.png');"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-0 bg-gradient-to-b from-[rgb(var(--bg))]/75 via-[rgb(var(--bg))]/85 to-[rgb(var(--bg))]"
		aria-hidden="true"
	></div>

	<div
		class="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-32 pt-20 text-center md:px-8 md:pb-32 md:pt-28"
	>
		<Badge variant="neutral" size="md">Uma rede de contratos, arbitragem e reputação</Badge>

		<h1
			class="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))] md:text-6xl lg:text-7xl"
		>
			Private Law <span class="text-gradient-brand">Society</span>
		</h1>

		<p class="max-w-2xl text-base text-[rgb(var(--text-muted))] md:text-lg">
			A Private Law Society é um sistema descentralizado de justiça, uma rede de contratos,
			arbitragem e reputação sem governos.
		</p>

		<div class="flex flex-wrap items-center justify-center gap-3 pt-2">
			<Button href="/pt/bjp" variant="primary" size="lg">
				Criar contrato
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="5" y1="12" x2="19" y2="12" />
					<polyline points="12 5 19 12 12 19" />
				</svg>
			</Button>
			<Button href="/pt/wot" variant="outline" size="lg">Verificar confiabilidade</Button>
			<Button href="/pt/manifesto" variant="ghost" size="lg">Ler o manifesto</Button>
		</div>
	</div>
</section>

<section class="border-t border-[rgb(var(--border))]">
	<div class="mx-auto w-full max-w-4xl px-4 py-20 md:px-8 md:py-24">
		<div class="mb-10 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Sobre</p>
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl">
				Sobre a PLS
			</h2>
		</div>

		<Card
			class="flex flex-col gap-6 text-base leading-relaxed text-[rgb(var(--text-muted))] md:text-lg"
		>
			<p>
				A Private Law Society é um projeto que busca construir um sistema descentralizado de justiça
				para um mundo pós-Estado. Ela substitui o monopólio coercitivo do Estado por criptografia,
				participação voluntária e reputação.
			</p>

			<blockquote class="border-l-4 border-pls-blue-500 pl-5 italic text-[rgb(var(--text))]">
				“With the monopoly of protection abolished, the problem of enforcement is turned over to
				freely competing individuals…”
				<footer class="mt-2 text-sm not-italic text-[rgb(var(--text-faint))]">
					— Hans-Hermann Hoppe, 1998
				</footer>
			</blockquote>

			<p>
				A PLS combina contratos, arbitragem e confiança distribuída. Disputas são resolvidas por
				árbitros escolhidos previamente, respaldados por garantias em Bitcoin ou por mecanismos de
				reputação, de modo que a execução não dependa de nenhuma autoridade central.
			</p>

			<p>
				Dois protocolos centrais tornam isso possível:
				<strong class="text-[rgb(var(--text))]">Bitcoin Justice Protocol (BJP)</strong>
				permite contratos voluntários assegurados por garantias em Bitcoin e árbitros humanos, enquanto
				<strong class="text-[rgb(var(--text))]">Web of Trust (WoT)</strong>
				constrói reputação baseada no Nostr por meio de endossos sociais.
			</p>

			<div class="flex flex-wrap gap-3 pt-2">
				<Button href="/pt/bjp" variant="outline">Sobre o BJP</Button>
				<Button href="/pt/wot" variant="outline">Sobre o WoT</Button>
				<Button href="/pt/manifesto" variant="outline">Ler manifesto</Button>
			</div>
		</Card>
	</div>
</section>

<section class="border-t border-[rgb(var(--border))]">
	<div class="mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-24">
		<div class="mb-12 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">
				Contribuidores
			</p>
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl">
				Equipe voluntária
			</h2>
			<p class="mt-3 text-sm text-[rgb(var(--text-muted))]">
				As pessoas que constroem a PLS no tempo livre.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each team as member}
				<Card padding="sm" class="flex h-full items-center gap-4">
					<img
						src={member.avatar}
						alt={member.name}
						loading="lazy"
						class="h-14 w-14 flex-none rounded-2xl object-cover ring-1 ring-[rgb(var(--border-strong))] shadow-glow"
					/>
					<div class="flex min-w-0 flex-1 flex-col gap-0.5">
						<p class="truncate font-semibold text-[rgb(var(--text))]">{member.name}</p>
						<p class="truncate text-xs text-[rgb(var(--text-muted))]">{member.role}</p>
						<a
							href={member.href}
							target="_blank"
							rel="noopener noreferrer"
							title={member.platform === 'github'
								? 'GitHub'
								: member.platform === 'x'
									? 'X (Twitter)'
									: 'Nostr'}
							aria-label={`${member.name} on ${member.platform}`}
							class="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-[rgb(var(--text-muted))] transition-colors hover:bg-[rgb(var(--surface-2))] hover:text-pls-blue-400"
						>
							{#if member.platform === 'github'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="currentColor"
									><path
										d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.2 9.17 7.64 10.66.56.1.76-.25.76-.55 0-.27-.01-1.17-.02-2.12-3.11.68-3.77-1.32-3.77-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.16-3-.12-.29-.5-1.44.11-3 0 0 .94-.3 3.09 1.15.9-.25 1.86-.38 2.82-.38s1.92.13 2.82.38c2.15-1.45 3.09-1.15 3.09-1.15.62 1.56.23 2.71.11 3 .72.78 1.16 1.78 1.16 3 0 4.3-2.61 5.24-5.1 5.52.4.34.76 1.02.76 2.05 0 1.48-.01 2.68-.01 3.05 0 .3.2.65.77.54 4.43-1.48 7.63-5.7 7.63-10.65C23.25 5.48 18.27.5 12 .5z"
									/></svg
								>
							{:else if member.platform === 'x'}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="currentColor"
									><path
										d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
									/></svg
								>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M4 4l16 16" /><path d="M20 4L4 20" /><circle
										cx="12"
										cy="12"
										r="3"
									/></svg
								>
							{/if}
						</a>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</section>

<section class="border-t border-[rgb(var(--border))]">
	<div class="mx-auto w-full max-w-5xl px-4 py-20 md:px-8 md:py-24">
		<div class="mb-12 text-center">
			<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Contribua</p>
			<h2 class="mt-2 text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl">
				Como contribuir
			</h2>
			<p class="mt-3 text-sm text-[rgb(var(--text-muted))]">
				Apoie a PLS com sats, código ou divulgação.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<Card class="flex flex-col gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg
						>
					</div>
					<div>
						<h3 class="font-semibold text-[rgb(var(--text))]">Bitcoin</h3>
						<p class="text-xs text-[rgb(var(--text-muted))]">Doação on-chain</p>
					</div>
				</div>
				<div
					class="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
				>
					<p class="flex-1 break-all font-mono text-xs text-[rgb(var(--text))]">{btcAddress}</p>
					<CopyButton value={btcAddress} />
				</div>
			</Card>

			<Card class="flex flex-col gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400 ring-1 ring-yellow-400/30"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg
						>
					</div>
					<div>
						<h3 class="font-semibold text-[rgb(var(--text))]">Lightning</h3>
						<p class="text-xs text-[rgb(var(--text-muted))]">Endereço Lightning</p>
					</div>
				</div>
				<div
					class="flex items-center gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] p-3"
				>
					<p class="flex-1 break-all font-mono text-xs text-[rgb(var(--text))]">
						{lightningAddress}
					</p>
					<CopyButton value={lightningAddress} />
				</div>
			</Card>

			<Card class="flex flex-col gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgb(var(--surface-2))] text-[rgb(var(--text))] ring-1 ring-[rgb(var(--border-strong))]"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="currentColor"
							><path
								d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.96 3.2 9.17 7.64 10.66.56.1.76-.25.76-.55 0-.27-.01-1.17-.02-2.12-3.11.68-3.77-1.32-3.77-1.32-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.16-3-.12-.29-.5-1.44.11-3 0 0 .94-.3 3.09 1.15.9-.25 1.86-.38 2.82-.38s1.92.13 2.82.38c2.15-1.45 3.09-1.15 3.09-1.15.62 1.56.23 2.71.11 3 .72.78 1.16 1.78 1.16 3 0 4.3-2.61 5.24-5.1 5.52.4.34.76 1.02.76 2.05 0 1.48-.01 2.68-.01 3.05 0 .3.2.65.77.54 4.43-1.48 7.63-5.7 7.63-10.65C23.25 5.48 18.27.5 12 .5z"
							/></svg
						>
					</div>
					<div>
						<h3 class="font-semibold text-[rgb(var(--text))]">Código</h3>
						<p class="text-xs text-[rgb(var(--text-muted))]">Contribuições open source</p>
					</div>
				</div>
				<Button href="https://github.com/PrivateLawSociety/" variant="outline" fullWidth>
					github.com/PrivateLawSociety ↗
				</Button>
			</Card>

			<Card class="flex flex-col gap-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><path
								d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
							/></svg
						>
					</div>
					<div>
						<h3 class="font-semibold text-[rgb(var(--text))]">Entre no projeto</h3>
						<p class="text-xs text-[rgb(var(--text-muted))]">Comunidade no Discord</p>
					</div>
				</div>
				<Button href="https://discord.gg/PNE3PZTUNz" variant="outline" fullWidth>
					Entrar no Discord da PLS ↗
				</Button>
			</Card>
		</div>

		<Card class="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Newsletter</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Receba atualizações sobre PLS, BJP e WoT diretamente no seu e-mail.
				</p>
			</div>
			<Button href="mailto:privatelawsociety.net@gmail.com?subject=Newsletter" variant="primary">
				Inscrever-se
			</Button>
		</Card>
	</div>
</section>

<SiteFooter />
