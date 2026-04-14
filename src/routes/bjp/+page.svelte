<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	const archivedBackgroundImage =
		'https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,fit=crop/JX5RGOWZAr6GRHlU/fundo-pls-nBNMM3nMwpqrb8iV.png';
	const bjpPrimerPreview =
		'https://drive.google.com/file/d/15RNZIMlvKaM5F6ASrW1tXUx1Du9FMYpS/preview';
	const bjpPrimerView = 'https://drive.google.com/file/d/15RNZIMlvKaM5F6ASrW1tXUx1Du9FMYpS/view';
	const bjpExplainerVideo = 'https://www.youtube.com/embed/uCmkXGvlu3w';
	const bjpPortugueseTutorialVideo = 'https://www.youtube.com/embed/dPRq7Z-e8Gg';
</script>

{#if $nostrAuth?.pubkey}
	<div class="flex flex-col items-center gap-12 py-10 md:py-16">
		<div class="flex flex-col items-center gap-4 text-center">
			<Badge variant="success" size="md">
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
				Signed in
			</Badge>
			<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-[rgb(var(--text))]">
				What do you want to do?
			</h1>
			<p class="max-w-xl text-base md:text-lg text-[rgb(var(--text-muted))]">
				Draft a new agreement or inspect an existing one. Everything stays local — your keys never
				leave this browser.
			</p>
		</div>

		<div class="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
			<a href="/bjp/contract/create" class="group block">
				<Card class="h-full transition-all group-hover:border-pls-blue-400 group-hover:shadow-glow">
					<div class="flex items-start gap-4">
						<div
							class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-glow"
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
								<path d="M12 20h9" />
								<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
							</svg>
						</div>
						<div class="flex-1">
							<h2 class="text-xl font-bold text-[rgb(var(--text))]">Create contract</h2>
							<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
								Draft a new agreement, pick clients and arbitrators, and lock it with Bitcoin
								collateral.
							</p>
							<span
								class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400"
							>
								Start
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
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
							</span>
						</div>
					</div>
				</Card>
			</a>

			<a href="/bjp/contract/verify" class="group block">
				<Card class="h-full transition-all group-hover:border-pls-blue-400 group-hover:shadow-glow">
					<div class="flex items-start gap-4">
						<div
							class="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[rgb(var(--surface-2))] text-pls-blue-400 ring-1 ring-[rgb(var(--border-strong))]"
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
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
								<circle cx="12" cy="12" r="3" />
							</svg>
						</div>
						<div class="flex-1">
							<h2 class="text-xl font-bold text-[rgb(var(--text))]">View contract</h2>
							<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
								Load an Agreement Proof to verify signatures and unlock multisig actions.
							</p>
							<span
								class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400"
							>
								Open
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
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
							</span>
						</div>
					</div>
				</Card>
			</a>
		</div>
	</div>
{:else}
	<div class="flex flex-col items-center gap-12 py-12 md:py-20">
		<div class="flex flex-col items-center gap-6 text-center">
			<Badge variant="neutral" size="md">Bitcoin Justice Protocol</Badge>
			<h1
				class="max-w-3xl text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))]"
			>
				Secure your contracts with
				<span class="text-gradient-brand">bitcoin</span>
			</h1>
			<p class="max-w-2xl text-base md:text-lg text-[rgb(var(--text-muted))]">
				Decentralized agreements with enforceable terms. Lock the collateral, pick your arbitrators,
				and settle disputes without trusting a custodian.
			</p>
			<Button href="/bjp/start" size="lg" variant="primary" class="mt-2">
				Start
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
		</div>

		<div class="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
			<Card padding="sm" class="flex flex-col gap-2">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-pls-blue-500/10 text-pls-blue-400"
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
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Trustless</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Collateral is locked in a multisig nobody controls alone.
				</p>
			</Card>
			<Card padding="sm" class="flex flex-col gap-2">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-pls-accent-500/10 text-pls-accent-400"
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
					>
						<path d="M9 12l2 2 4-4" />
						<path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
					</svg>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Enforceable</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Arbitrators can slash the non-complying party — but never run off with funds.
				</p>
			</Card>
			<Card padding="sm" class="flex flex-col gap-2">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400"
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
					>
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
					</svg>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Private</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Keys stay in your browser. Contracts travel encrypted over Nostr.
				</p>
			</Card>
		</div>
	</div>
{/if}

<section class="border-t border-[rgb(var(--border))] py-16 md:py-20">
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 md:px-8">
		<div class="flex flex-col items-center gap-4 text-center">
			<Badge variant="info" size="md">Bitcoin Justice Protocol</Badge>
			<h2
				class="max-w-4xl text-3xl md:text-4xl font-extrabold tracking-tight text-[rgb(var(--text))]"
			>
				How the Bitcoin Justice Protocol works
			</h2>
			<p class="max-w-3xl text-base md:text-lg text-[rgb(var(--text-muted))]">
				Bitcoin Justice Protocol is a system for resolving disputes without courts or custodians. It
				uses Bitcoin as collateral, Nostr for coordination, and human arbitrators chosen by the
				parties. Outcomes are enforced by incentives, not force, simple, voluntary, and sovereign by
				design.
			</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
			<Card class="flex flex-col gap-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">
						Start with the file
					</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">Read the BJP primer</h3>
					<p class="mt-2 text-[rgb(var(--text-muted))]">
						Start with the core file if you want the protocol logic before opening the contract
						flow.
					</p>
				</div>
				<div
					class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
				>
					<iframe title="BJP Primer" src={bjpPrimerPreview} class="h-[420px] w-full" loading="lazy"
					></iframe>
				</div>
				<div class="flex flex-wrap gap-3">
					<Button href={bjpPrimerView} target="_blank" rel="noopener noreferrer" variant="outline">
						Open primer
					</Button>
					<Button href="/bjp/start" variant="primary">Use PLS BJP</Button>
				</div>
			</Card>

			<Card class="overflow-hidden p-0">
				<div
					class="min-h-[280px] bg-cover bg-center"
					style={`background-image: linear-gradient(180deg, rgba(6,12,24,0.08), rgba(6,12,24,0.55)), url('${archivedBackgroundImage}');`}
				></div>
				<div class="border-t border-[rgb(var(--border))] p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Why BJP</p>
					<h3 class="mt-2 text-xl font-bold text-[rgb(var(--text))]">
						Voluntary enforcement, sovereign coordination
					</h3>
					<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
						BJP is an alternative to both courts and custodians, tied directly here to the live
						contract creator and verification flows.
					</p>
				</div>
			</Card>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<Card class="flex flex-col gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Video</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">How does the BJP work?</h3>
				</div>
				<div
					class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
				>
					<iframe
						title="How does the BJP work?"
						src={bjpExplainerVideo}
						class="aspect-video w-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
						loading="lazy"
					></iframe>
				</div>
			</Card>

			<Card class="flex flex-col gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">
						Portuguese tutorial
					</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">
						BJP tutorial (in Portuguese)
					</h3>
				</div>
				<div
					class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
				>
					<iframe
						title="BJP tutorial in Portuguese"
						src={bjpPortugueseTutorialVideo}
						class="aspect-video w-full"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
						loading="lazy"
					></iframe>
				</div>
			</Card>
		</div>
	</div>
</section>

<SiteFooter />
