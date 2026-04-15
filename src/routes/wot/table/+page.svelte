<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { ReviewEvent } from '$lib/wot/index';
	import {
		getProfileMetadata,
		nostrAuth,
		parseProfileFromJsonString,
		type ProfileType,
		type Rating,
		relayList,
		relayPool
	} from '$lib/wot/nostr';
	import { npubEncode } from 'nostr-tools/nip19';
	import { onMount } from 'svelte';
	import ZapModal from '$lib/components/ZapModal.svelte';
	import ProfileAvatar from '$lib/components/ProfileAvatar.svelte';
	import { Input, Label, Select } from 'flowbite-svelte';
	import type { Event } from 'nostr-tools';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import { toasts } from 'svelte-toasts';

	let ZapModalComponent: ZapModal;

	let ratings: Rating[] = [];

	// Necessary to ensure that page is loaded before try to set any search param
	// It ensures that replaceState would not be called before router initialization
	let pageInitialized: boolean = false;

	let filterRating: string = 'all';
	let filterBusiness: string = 'all';
	let filterFrom: string = getRaterParam();
	let filterTo: string = getRatedParam();

	$: filteredRatings = ratings.filter((rating) => {
		let ratingMatch = true;
		if (filterRating === 'positive') {
			ratingMatch = rating.score === true;
		} else if (filterRating === 'negative') {
			ratingMatch = rating.score === false;
		}

		let businessMatch = true;
		if (filterBusiness === 'yes') {
			businessMatch = rating.businessAlreadyDone === true;
		} else if (filterBusiness === 'no') {
			businessMatch = rating.businessAlreadyDone === false;
		}

		let fromMatch = true;
		if (filterFrom.trim() !== '') {
			fromMatch = rating.from.npub.toLowerCase().includes(filterFrom.toLowerCase());
		}

		let toMatch = true;
		if (filterTo.trim() !== '') {
			toMatch = rating.to.npub.toLowerCase().includes(filterTo.toLowerCase());
		}

		return ratingMatch && businessMatch && fromMatch && toMatch;
	});

	$: ratings.sort((a, b) => b.date - a.date);

	$: setRaterParam(filterFrom);
	$: setRatedParam(filterTo);

	const events: Event[] = [];

	onMount(() => {
		pageInitialized = true;

		relayPool.subscribeMany(
			relayList,
			{
				kinds: [ReviewEvent],
				'#l': ['pls-wot-rating']
			},
			{
				onevent(e) {
					try {
						events.push(e);

						const c = JSON.parse(e.content);

						const from: ProfileType = {
							npub: npubEncode(c.from),
							pubkey: c.from
						};

						const to: ProfileType = {
							npub: npubEncode(c.to),
							pubkey: c.to
						};

						const newRating: Rating = {
							eventId: e.id,
							from: from,
							to: to,
							date: e.created_at * 1000,
							score: c.score,
							businessAlreadyDone: c.businessAlreadyDone,
							description: c.description
						};

						ratings = ratings.filter((r) => !(r.eventId === newRating.eventId));

						ratings = [...ratings, newRating];

						Promise.all([getProfileMetadata(c.from), getProfileMetadata(c.to)])
							.then(([fromEvent, toEvent]) => {
								Object.assign(from, parseProfileFromJsonString(fromEvent?.content || '{}', from));

								Object.assign(to, parseProfileFromJsonString(toEvent?.content || '{}', to));
							})
							.catch((error) => {
								console.error('Error when processing the profile metadata:', error);
							})
							.finally(() => {
								const ratingIndex = ratings.findIndex((r) => r.eventId === newRating.eventId);
								ratings[ratingIndex] = newRating;
							});
					} catch (error) {
						console.error('Error processing the event:', error);
					}
				}
			}
		);
	});

	const download = (filename: string, text: any) => {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
		element.setAttribute('download', filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	function getRaterParam(): string {
		return page.url.searchParams.get('rater') || '';
	}

	function setRaterParam(rater: string) {
		// Ensure that page has initialized
		if (!pageInitialized) return;

		if (rater) {
			page.url.searchParams.set('rater', rater);
		} else {
			page.url.searchParams.delete('rater');
		}
		replaceState(page.url, page.state);
	}

	function getRatedParam(): string {
		return page.url.searchParams.get('rated') || '';
	}

	function setRatedParam(rated: string) {
		// Ensure that page has initialized
		if (!pageInitialized) return;

		if (rated) {
			page.url.searchParams.set('rated', rated);
		} else {
			page.url.searchParams.delete('rated');
		}
		replaceState(page.url, page.state);
	}

	async function copyNpub(npub: string) {
		await navigator.clipboard.writeText(npub);
		toasts.success({
			title: 'Copied NPUB!',
			description: 'NPUB copied to clipboard'
		});
	}

	async function copyLinkToClipboard() {
		await navigator.clipboard.writeText(page.url.toString());
		toasts.success({
			title: 'Copied!',
			description: 'Link copied to clipboard!'
		});
	}

	const handleDownload = (myRatings: boolean = false) => {
		if (myRatings) {
			if (!$nostrAuth?.pubkey) {
				toasts.error({
					title: 'Not logged in',
					description: 'You must be logged to perform this action'
				});
				return;
			}

			let myRatingsEventId = ratings
				.filter((r) => r.from.pubkey === $nostrAuth?.pubkey || r.to.pubkey === $nostrAuth?.pubkey)
				.map((r) => {
					return r.eventId;
				});

			let myRatingsEvents = events.filter((e) => myRatingsEventId.includes(e.id));

			return download('ratings.json', JSON.stringify(myRatingsEvents, null, '\t'));
		}

		let filteredRatingsEventId = filteredRatings.map((r) => {
			return r.eventId;
		});

		let filteredRatingsEvents = events.filter((e) => filteredRatingsEventId.includes(e.id));

		return download('ratings.json', JSON.stringify(filteredRatingsEvents, null, '\t'));
	};

	let expandedItems = new Set<string>();

	function toggleExpanded(id: string) {
		if (expandedItems.has(id)) {
			expandedItems.delete(id);
		} else {
			expandedItems.add(id);
		}
		expandedItems = expandedItems;
	}

	const isPortuguese = page.url.pathname.startsWith('/pt/');
</script>

<ZapModal bind:this={ZapModalComponent} />

<div class="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 py-10 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">{isPortuguese ? 'Rede de Confiança' : 'Web of Trust'}</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			{isPortuguese ? 'Avaliações' : 'Ratings'}
		</h1>
		<p class="max-w-3xl text-sm text-[rgb(var(--text-muted))] md:text-base">
			{isPortuguese
				? 'Explore atestações de confiança, filtre participantes e compartilhe a visão atual.'
				: 'Browse trust attestations, filter by participants, and share the current view.'}
		</p>
	</div>

	<Card class="flex w-full flex-wrap justify-center gap-4">
		<div class="flex flex-col gap-1">
			<Label for="filterRating" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por avaliação:' : 'Filter by Rating:'}
			</Label>
			<Select
				id="filterRating"
				bind:value={filterRating}
				items={[
					{ value: 'all', name: isPortuguese ? 'Todas' : 'All' },
					{ value: 'positive', name: isPortuguese ? 'Positivas' : 'Positive' },
					{ value: 'negative', name: isPortuguese ? 'Negativas' : 'Negative' }
				]}
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<Label for="filterBusiness" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por já ter feito negócio:' : 'Filter by Had Business:'}
			</Label>
			<Select
				id="filterBusiness"
				bind:value={filterBusiness}
				items={[
					{ value: 'all', name: isPortuguese ? 'Todas' : 'All' },
					{ value: 'yes', name: isPortuguese ? 'Sim' : 'Yes' },
					{ value: 'no', name: isPortuguese ? 'Não' : 'No' }
				]}
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<Label for="filterFrom" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por quem avaliou:' : 'Filter by Who Rated:'}
			</Label>
			<Input
				id="filterFrom"
				bind:value={filterFrom}
				placeholder={isPortuguese ? 'Digite a chave de quem avaliou' : 'Enter Rater Key'}
				autocomplete="off"
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<Label for="filterTo" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por quem foi avaliado:' : 'Filter by Who Was Rated:'}
			</Label>
			<Input
				id="filterTo"
				bind:value={filterTo}
				placeholder={isPortuguese ? 'Digite a chave de quem foi avaliado' : 'Enter Rated Key'}
				autocomplete="off"
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<Label for="downloadReviews" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Baixar avaliações:' : 'Download reviews:'}
			</Label>

			<div class="flex grid-cols-2 gap-2">
				<Button variant="primary" on:click={() => handleDownload()}>
					{isPortuguese ? 'Dos filtros' : 'From filters'}
				</Button>

				{#if $nostrAuth?.pubkey}
					<Button variant="secondary" on:click={() => handleDownload(true)}>
						{isPortuguese ? 'Todas as minhas avaliações' : 'All My Reviews'}
					</Button>
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<Label for="getFilterLinks" class="font-semibold text-[rgb(var(--text))]">
				{isPortuguese ? 'Link dos filtros:' : 'Get filters link:'}
			</Label>

			<div class="grid-cols flex gap-2">
				<Button variant="outline" on:click={() => copyLinkToClipboard()}>
					{isPortuguese ? 'Copiar para área de transferência' : 'Copy to clipboard'}
				</Button>
			</div>
		</div>
	</Card>

	<!-- Modern card-based table -->
	<div class="w-full space-y-4 px-4">
		{#each filteredRatings as rating}
			<Card
				class="border-[rgb(var(--border-strong))] transition-all hover:border-pls-blue-400 hover:shadow-glow"
			>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
					<!-- Rater Section -->
					<div class="flex flex-col gap-3">
						<span class="text-sm font-semibold text-pls-blue-400">
							{isPortuguese ? 'Quem avaliou' : 'Who Rated'}
						</span>
						<div class="flex items-center gap-3">
							<a href="https://njump.me/{rating.from.npub}" target="_blank">
								<ProfileAvatar source={rating.from.picture} />
							</a>
							<div class="flex-1">
								<div class="font-medium text-[rgb(var(--text))]">
									{rating.from.display_name ||
										rating.from.name ||
										(isPortuguese ? 'Anônimo' : 'Anonymous')}
								</div>
								<div class="group relative">
									<button
										on:click={() => copyNpub(rating.from.npub)}
										class="text-sm text-[rgb(var(--text-muted))] hover:text-pls-blue-400"
									>
										{`${rating.from.npub.slice(0, 10)}...${rating.from.npub.slice(-10)}`}
									</button>
									<span
										class="absolute left-0 top-full z-10 hidden whitespace-nowrap rounded-md border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] p-2 text-sm text-[rgb(var(--text))] group-hover:block"
									>
										{rating.from.npub}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Rated Section -->
					<div class="flex flex-col gap-3">
						<span class="text-sm font-semibold text-pls-blue-400">
							{isPortuguese ? 'Quem foi avaliado' : 'Who Was Rated'}
						</span>
						<div class="flex items-center gap-3">
							<a href="https://njump.me/{rating.to.npub}" target="_blank">
								<ProfileAvatar source={rating.to.picture} />
							</a>
							<div class="flex-1">
								<div class="font-medium text-[rgb(var(--text))]">
									{rating.to.display_name ||
										rating.to.name ||
										(isPortuguese ? 'Anônimo' : 'Anonymous')}
								</div>
								<div class="group relative">
									<button
										on:click={() => copyNpub(rating.to.npub)}
										class="text-sm text-[rgb(var(--text-muted))] hover:text-pls-blue-400"
									>
										{`${rating.to.npub.slice(0, 10)}...${rating.to.npub.slice(-10)}`}
									</button>
									<span
										class="absolute left-0 top-full z-10 hidden whitespace-nowrap rounded-md border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] p-2 text-sm text-[rgb(var(--text))] group-hover:block"
									>
										{rating.to.npub}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Info Section -->
					<div class="flex flex-col gap-3">
						<span class="text-sm font-semibold text-pls-blue-400">
							{isPortuguese ? 'Info da avaliação' : 'Rating Info'}
						</span>
						<div class="space-y-2 text-sm text-[rgb(var(--text-muted))]">
							<div class="flex items-center justify-between">
								<span class="text-[rgb(var(--text-muted))]">{isPortuguese ? 'Data:' : 'Date:'}</span
								>
								<span class="text-[rgb(var(--text))]">
									{new Date(rating.date).toLocaleDateString()}
									{new Date(rating.date).toLocaleTimeString()}
								</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-[rgb(var(--text-muted))]"
									>{isPortuguese ? 'Avaliação:' : 'Rating:'}</span
								>
								{#if rating.score}
									<span class="shrink-0 h-6 w-6" aria-hidden="true"></span>
								{/if}
								<span class="text-2xl">{rating.score ? '✅' : '❌'}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-[rgb(var(--text-muted))]">
									{isPortuguese ? 'Já fez negócio:' : 'Had Business:'}
								</span>
								<span class="text-2xl">{rating.businessAlreadyDone ? '✅' : '❌'}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Description Section -->
				<div class="mt-4 border-t border-[rgb(var(--border))] pt-4">
					<span class="mb-2 block text-sm font-semibold text-pls-blue-400">
						{isPortuguese ? 'Descrição' : 'Description'}
					</span>
					<div class="text-[rgb(var(--text))]">
						<p
							class={expandedItems.has(rating.eventId)
								? 'whitespace-pre-wrap break-words'
								: 'line-clamp-3 break-words'}
						>
							{rating.description ||
								(isPortuguese ? 'Nenhuma descrição fornecida' : 'No description provided')}
						</p>
						{#if rating.description.length > 250}
							<button
								on:click={() => toggleExpanded(rating.eventId)}
								class="mt-2 text-sm text-pls-blue-400 transition-colors hover:text-pls-blue-300"
							>
								{expandedItems.has(rating.eventId)
									? isPortuguese
										? '▲ Mostrar menos'
										: '▲ Show less'
									: isPortuguese
										? '▼ Mostrar mais'
										: '▼ Show more'}
							</button>
						{/if}
					</div>
				</div>

				<!-- Zap Button -->
				{#if rating.from.lud16}
					<div class="mt-4 flex justify-end border-t border-[rgb(var(--border))] pt-4">
						<Button
							type="button"
							variant="outline"
							size="sm"
							on:click={() => ZapModalComponent.openModal(rating.from.npub, rating.eventId)}
						>
							{isPortuguese ? '⚡ Enviar Zap' : '⚡ Send Zap'}
						</Button>
					</div>
				{/if}
			</Card>
		{/each}

		{#if filteredRatings.length === 0}
			<Card class="p-8 text-center">
				<p class="text-[rgb(var(--text-muted))]">
					{isPortuguese
						? 'Nenhuma avaliação encontrada com os filtros atuais.'
						: 'No ratings found matching the current filters.'}
				</p>
			</Card>
		{/if}
	</div>
</div>
