<script lang="ts">
	import { nostrAuth } from '$lib/nostr';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
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
				Conectado
			</Badge>
			<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
				O que você quer fazer?
			</h1>
			<p class="max-w-xl text-base text-[rgb(var(--text-muted))] md:text-lg">
				Redija um novo acordo ou inspecione um já existente. Tudo permanece local, suas chaves não
				saem deste navegador.
			</p>
		</div>

		<div class="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
			<a href="/pt/bjp/contract/create" class="group block">
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
								><path d="M12 20h9" /><path
									d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
								/></svg
							>
						</div>
						<div class="flex-1">
							<h2 class="text-xl font-bold text-[rgb(var(--text))]">Criar contrato</h2>
							<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
								Redija um novo acordo, escolha clientes e árbitros, e bloqueie a garantia em
								Bitcoin.
							</p>
							<span
								class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400"
							>
								Começar
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
									><line x1="5" y1="12" x2="19" y2="12" /><polyline
										points="12 5 19 12 12 19"
									/></svg
								>
							</span>
						</div>
					</div>
				</Card>
			</a>

			<a href="/pt/bjp/contract/verify" class="group block">
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
								><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle
									cx="12"
									cy="12"
									r="3"
								/></svg
							>
						</div>
						<div class="flex-1">
							<h2 class="text-xl font-bold text-[rgb(var(--text))]">Ver contrato</h2>
							<p class="mt-1 text-sm text-[rgb(var(--text-muted))]">
								Carregue uma prova do acordo para verificar assinaturas e desbloquear ações de
								multisig.
							</p>
							<span
								class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pls-blue-400"
							>
								Abrir
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
									><line x1="5" y1="12" x2="19" y2="12" /><polyline
										points="12 5 19 12 12 19"
									/></svg
								>
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
			<Badge variant="neutral" size="md">Protocolo de Justiça BTC</Badge>
			<h1
				class="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[rgb(var(--text))] md:text-6xl"
			>
				Proteja seus contratos com
				<span class="text-gradient-brand">bitcoin</span>
			</h1>
			<p class="max-w-2xl text-base text-[rgb(var(--text-muted))] md:text-lg">
				Acordos descentralizados com execução real. Bloqueie a garantia, escolha seus árbitros e
				resolva disputas sem confiar em um custodiante.
			</p>
			<Button href="/pt/bjp/start" size="lg" variant="primary" class="mt-2">
				Começar
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
					><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg
				>
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
						><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path
							d="M7 11V7a5 5 0 0 1 10 0v4"
						/></svg
					>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Sem confiança</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					A garantia fica presa em uma multisig que ninguém controla sozinho.
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
						><path d="M9 12l2 2 4-4" /><path
							d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
						/></svg
					>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Executável</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					Árbitros podem punir a parte inadimplente, mas não podem fugir com os fundos.
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
						stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg
					>
				</div>
				<h3 class="font-semibold text-[rgb(var(--text))]">Privado</h3>
				<p class="text-sm text-[rgb(var(--text-muted))]">
					As chaves ficam no seu navegador. Os contratos viajam criptografados pelo Nostr.
				</p>
			</Card>
		</div>
	</div>
{/if}

<section class="border-t border-[rgb(var(--border))] py-16 md:py-20">
	<div class="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 md:px-8">
		<div class="flex flex-col items-center gap-4 text-center">
			<Badge variant="info" size="md">Protocolo de Justiça BTC</Badge>
			<h2
				class="max-w-4xl text-3xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-4xl"
			>
				Como o Bitcoin Justice Protocol funciona
			</h2>
			<p class="max-w-3xl text-base text-[rgb(var(--text-muted))] md:text-lg">
				O Bitcoin Justice Protocol é um sistema para resolver disputas sem tribunais ou
				custodiantes. Ele usa Bitcoin como garantia, Nostr para coordenação e árbitros humanos
				escolhidos pelas partes. Os resultados são executados por incentivos, não por força.
			</p>
		</div>

		<div class="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
			<Card class="flex flex-col gap-5">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">
						Comece pelo arquivo
					</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">Leia o primer do BJP</h3>
					<p class="mt-2 text-[rgb(var(--text-muted))]">
						Comece pelo arquivo principal se quiser entender a lógica do protocolo antes de abrir o
						fluxo de contrato.
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
						Abrir primer
					</Button>
					<Button href="/pt/bjp/start" variant="primary">Usar PLS BJP</Button>
				</div>
			</Card>

			<Card class="overflow-hidden p-0">
				<div
					class="min-h-[280px] bg-cover bg-center"
					style={`background-image: linear-gradient(180deg, rgba(6,12,24,0.08), rgba(6,12,24,0.55)), url('${archivedBackgroundImage}');`}
				></div>
				<div class="border-t border-[rgb(var(--border))] p-6">
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">
						Por que BJP
					</p>
					<h3 class="mt-2 text-xl font-bold text-[rgb(var(--text))]">
						Execução voluntária, coordenação soberana
					</h3>
					<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
						O BJP é uma alternativa a tribunais e custodiantes, ligado diretamente aqui aos fluxos
						reais de criação e verificação de contratos.
					</p>
				</div>
			</Card>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<Card class="flex flex-col gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-[0.2em] text-pls-blue-400">Vídeo</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">Como o BJP funciona?</h3>
				</div>
				<div
					class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
				>
					<iframe
						title="Como o BJP funciona?"
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
						Tutorial em português
					</p>
					<h3 class="mt-2 text-2xl font-bold text-[rgb(var(--text))]">
						Tutorial do BJP (em português)
					</h3>
				</div>
				<div
					class="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]"
				>
					<iframe
						title="Tutorial do BJP em português"
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
