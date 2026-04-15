<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Graph from 'graphology';
	import {
		type EdgeData,
		type GraphRating,
		isRatingFilterHadBusiness,
		isRatingFilterScore,
		type NodeData,
		type RatingFilterHadBusinessType,
		type RatingFilterScoreType
	} from './types';
	import 'vis-network/styles/vis-network.css';
	import {
		getProfileMetadata,
		nostrAuth,
		parseProfileFromJsonString,
		type ProfileType,
		relayList,
		relayPool
	} from '$lib/wot/nostr';
	import type { SubCloser } from 'nostr-tools/abstract-pool';
	import { ReviewEvent } from '$lib/wot/index';
	import { nip19 } from 'nostr-tools';
	import { Checkbox, Helper, Input, Label, Select } from 'flowbite-svelte';
	import RenderGraph from './RenderGraph.svelte';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { toasts } from 'svelte-toasts';

	const depth = 3;

	const nodeWidths = {
		width: 5,
		hoverWidth: 10
	};

	const edgeWidths = {
		width: 5,
		hoverWidth: 10
	};

	const subscriptions: Record<string, SubCloser> = {};

	const graph: Graph<NodeData, EdgeData> = new Graph();

	let ratings: GraphRating[] = [];

	let pageInitialized = false;

	const userPubkey = nostrAuth.getPubkey();

	let pubkey: string | undefined = loadPubkey();

	let npub: string | undefined = loadNpub();

	let processNpubError: boolean = false;

	function loadPubkey() {
		const urlNpub = page.url.searchParams.get('mainNpub');

		try {
			if (urlNpub) {
				const newPubkey = nip19.decode(urlNpub);

				if (newPubkey.type !== 'npub') {
					processNpubError = true;
					return;
				}

				return newPubkey.data;
			}
		} catch {
			processNpubError = true;
			return;
		}

		return nostrAuth.getPubkey();
	}

	function loadNpub() {
		const urlNpub = page.url.searchParams.get('mainNpub');

		if (urlNpub) return urlNpub;

		const pubkey = nostrAuth.getPubkey();

		if (!pubkey) return;

		return nip19.npubEncode(pubkey);
	}

	function updatePubkey(npub: string | undefined) {
		function clearPubkey(error: boolean) {
			processNpubError = error;

			pubkey = undefined;
			page.url.searchParams.delete('mainNpub');
			replaceState(page.url, page.state);
		}

		function setPubkey(newPubkey: string) {
			processNpubError = false;

			pubkey = newPubkey;
			page.url.searchParams.set('mainNpub', npub!);
			replaceState(page.url, page.state);
		}

		if (!pageInitialized) return;

		if (!npub) {
			return void clearPubkey(false);
		}

		try {
			const newPubkey = nip19.decode(npub);

			if (newPubkey.type !== 'npub') {
				return clearPubkey(true);
			}

			setPubkey(newPubkey.data);
		} catch {
			clearPubkey(true);
		}
	}

	$: updatePubkey(npub);

	let targetPubkey: string | undefined = loadTargetPubkey();

	let targetNpub: string | undefined = loadTargetNpub();

	let processTargetNpubError: boolean = false;

	function loadTargetPubkey() {
		const urlNpub = page.url.searchParams.get('targetNpub');

		try {
			if (!urlNpub) return;

			const newTargetPubkey = nip19.decode(urlNpub);

			if (newTargetPubkey.type !== 'npub') {
				processTargetNpubError = true;
				return;
			}

			return newTargetPubkey.data;
		} catch {
			processTargetNpubError = true;
			return;
		}
	}

	function loadTargetNpub() {
		const urlNpub = page.url.searchParams.get('targetNpub');

		if (urlNpub) return urlNpub;
	}

	function updateTargetPubkey(targetNpub: string | undefined) {
		function clearPubkey(error: boolean) {
			processTargetNpubError = error;

			targetPubkey = undefined;
			page.url.searchParams.delete('targetNpub');
			replaceState(page.url, page.state);
		}

		function setPubkey(newPubkey: string) {
			processTargetNpubError = false;

			targetPubkey = newPubkey;
			page.url.searchParams.set('targetNpub', targetNpub!);
			replaceState(page.url, page.state);
		}

		if (!pageInitialized) return;

		if (!targetNpub) {
			return void clearPubkey(false);
		}

		try {
			const newTargetPubkey = nip19.decode(targetNpub);

			if (newTargetPubkey.type !== 'npub') {
				return void clearPubkey(true);
			}

			setPubkey(newTargetPubkey.data);
		} catch {
			clearPubkey(true);
		}
	}

	$: updateTargetPubkey(targetNpub);

	let firstSubscriptionEvent = true;

	let graphLoading = false;
	let graphHasData = false;
	let loadingTimer: ReturnType<typeof setTimeout> | undefined;

	function startLoading() {
		graphLoading = true;
		graphHasData = false;
		if (loadingTimer) clearTimeout(loadingTimer);
		loadingTimer = setTimeout(() => {
			graphLoading = false;
		}, 5000);
	}

	function markGotData() {
		graphHasData = true;
		graphLoading = false;
		if (loadingTimer) clearTimeout(loadingTimer);
	}

	interface SubscribeRatingEventsParams {
		depth: number;
		originalPubkey: string;
		fromTarget: boolean;
	}

	async function subscribeRatingEvents({
		depth,
		originalPubkey,
		fromTarget
	}: SubscribeRatingEventsParams) {
		firstSubscriptionEvent = false;
		clearGraph();
		startLoading();

		interface StartEventHandlingParams {
			pubkey: string;
			currentDepth: number;
			relatedRating?: GraphRating;
			relatedIsParent?: boolean;
		}

		async function startEventHandling({
			pubkey,
			currentDepth,
			relatedRating,
			relatedIsParent
		}: StartEventHandlingParams): Promise<GraphRating[]> {
			const baseRatings: GraphRating[] = [];

			const subscription =
				subscriptions[pubkey] ||
				relayPool.subscribeMany(
					relayList,
					{
						authors: relatedIsParent ? [pubkey] : undefined,
						'#d': relatedIsParent ? undefined : ['pls-wot-rating-' + pubkey],
						kinds: [ReviewEvent],
						'#l': ['pls-wot-rating']
					},
					{
						async onevent(e) {
							try {
								const c = JSON.parse(e.content);

								const from: ProfileType = {
									npub: nip19.npubEncode(c.from),
									pubkey: e.pubkey
								};

								const to: ProfileType = {
									npub: nip19.npubEncode(c.to),
									pubkey: c.to
								};

								const newRating: GraphRating = {
									eventId: e.id,
									from,
									to,
									date: e.created_at * 1000,
									score: c.score,
									businessAlreadyDone: c.businessAlreadyDone,
									description: c.description,
									parentRatings: [],
									childrenRatings: [],
									currentDepth
								};

								const ratingIndex = baseRatings.findIndex((r) => r.eventId === newRating.eventId);

								const relatedRatingArr = relatedIsParent ? 'parentRatings' : 'childrenRatings';

								const fallbackRelatedRatingArr = relatedIsParent
									? 'childrenRatings'
									: 'parentRatings';

								if (ratingIndex >= 0) {
									const oldRating = baseRatings[ratingIndex];

									if (relatedRating) {
										const relatedRatingIndex = oldRating[relatedRatingArr].findIndex(
											(p) => p.eventId === relatedRating.eventId
										);

										if (relatedRatingIndex >= 0) {
											oldRating[relatedRatingArr][relatedRatingIndex] = relatedRating;
										} else {
											oldRating[relatedRatingArr].push(relatedRating);
										}
									}

									baseRatings[ratingIndex] = newRating;
								} else {
									if (relatedRating) newRating[relatedRatingArr].push(relatedRating);

									baseRatings.push(newRating);

									const currentDepthCheck = relatedIsParent
										? currentDepth < depth
										: currentDepth > 0;

									const currentDepthIncrement = currentDepth + (relatedIsParent ? 1 : -1);

									if (currentDepthCheck) {
										const pubkey = relatedIsParent ? to.pubkey : from.pubkey;

										const fallbackRatings = await startEventHandling({
											pubkey,
											currentDepth: currentDepthIncrement,
											relatedRating: newRating,
											relatedIsParent
										});
										newRating[fallbackRelatedRatingArr] = fallbackRatings;
									}
								}

								Promise.all([getProfileMetadata(c.from), getProfileMetadata(c.to)])
									.then(([fromEvent, toEvent]) => {
										Object.assign(
											from,
											parseProfileFromJsonString(fromEvent?.content || '{}', from)
										);
										Object.assign(to, parseProfileFromJsonString(toEvent?.content || '{}', to));

										populateGraph({ rating: newRating });
									})
									.catch((error) => {
										console.error('Error when processing the profile metadata:', error);
									});

								populateGraph({ rating: newRating });
							} catch (err) {
								console.error('Error processing the event:', err);
							}
						}
					}
				);

			subscriptions[pubkey] = subscription;

			return baseRatings;
		}

		ratings = await startEventHandling({
			pubkey: originalPubkey,
			currentDepth: fromTarget ? depth : 0,
			relatedIsParent: !fromTarget
		});
	}

	function clearGraph() {
		for (const pubkey of Object.keys(subscriptions)) {
			const subscription = subscriptions[pubkey];
			subscription.close();
			delete subscriptions[pubkey];
		}

		graph.clear();

		ratings = [];
	}

	$: if (!npub && !targetNpub) {
		clearGraph();
		graphLoading = false;
		graphHasData = false;
		if (loadingTimer) clearTimeout(loadingTimer);

		renderGraph?.render();
	}

	interface PopupateGraphParams {
		rating: GraphRating;
	}

	async function populateGraph({ rating }: PopupateGraphParams) {
		async function mergeNode(profile: ProfileType) {
			const username = profile.displayName || profile.display_name || profile.name;

			const displayName = username;

			graph.mergeNode(profile.pubkey, {
				displayName,
				picture: profile.picture
			});
		}

		await Promise.all([mergeNode(rating.from), mergeNode(rating.to)]);

		graph.mergeDirectedEdge(rating.from.pubkey, rating.to.pubkey, {
			from: rating.from.pubkey,
			to: rating.to.pubkey,
			score: rating.score,
			businessAlreadyDone: rating.businessAlreadyDone,
			description: rating.description
		});

		markGotData();
		renderGraph?.render();
	}

	interface RenewSubscriptionsParams {
		pubkey?: string;
		targetPubkey?: string;
		firstSubscriptionEvent: boolean;
	}

	async function renewSubscriptions({
		pubkey,
		targetPubkey,
		firstSubscriptionEvent
	}: RenewSubscriptionsParams) {
		const originalPubkey = pubkey || targetPubkey;

		if (!originalPubkey) return;

		const ratingEventsProps: SubscribeRatingEventsParams = {
			originalPubkey,
			depth,
			fromTarget: !pubkey
		};

		if (firstSubscriptionEvent) {
			if (pubkey || targetPubkey) {
				await subscribeRatingEvents(ratingEventsProps);
			}

			return;
		}

		if ((pubkey && !targetPubkey) || (targetPubkey && !pubkey)) {
			await subscribeRatingEvents(ratingEventsProps);
		}
	}

	$: renewSubscriptions({ pubkey, targetPubkey, firstSubscriptionEvent });

	let physicsEnabled = true;

	let ratingScoreFilter: RatingFilterScoreType = loadRatingScoreFilter();

	function loadRatingScoreFilter(): RatingFilterScoreType {
		const urlRatingFilter = page.url.searchParams.get('ratingType');

		if (!urlRatingFilter) return 'all';

		if (!isRatingFilterScore(urlRatingFilter)) {
			return 'all';
		}

		return urlRatingFilter;
	}

	function updateRatingScoreFilterUrl(ratingFilter: RatingFilterScoreType) {
		if (!pageInitialized) return;

		if (ratingFilter === 'all') {
			page.url.searchParams.delete('ratingType');
		} else {
			page.url.searchParams.set('ratingType', ratingFilter);
		}

		replaceState(page.url, page.state);
	}

	$: updateRatingScoreFilterUrl(ratingScoreFilter);

	let ratingHadBusinessFilter: RatingFilterHadBusinessType = loadRatingHadBusinessFilter();

	function loadRatingHadBusinessFilter(): RatingFilterHadBusinessType {
		const urlRatingFilter = page.url.searchParams.get('hadBusiness');

		if (!urlRatingFilter) return 'all';

		if (!isRatingFilterHadBusiness(urlRatingFilter)) return 'all';

		return urlRatingFilter;
	}

	function updateRatingHadBusinessFilterUrl(ratingFilter: RatingFilterHadBusinessType) {
		if (!pageInitialized) return;

		if (ratingFilter === 'all') {
			page.url.searchParams.delete('hadBusiness');
		} else {
			page.url.searchParams.set('hadBusiness', ratingFilter);
		}

		replaceState(page.url, page.state);
	}

	$: updateRatingHadBusinessFilterUrl(ratingHadBusinessFilter);

	let renderGraph: RenderGraph | undefined;

	onMount(() => {
		pageInitialized = true;
	});

	async function copyLinkToClipboard() {
		await navigator.clipboard.writeText(page.url.toString());
		toasts.success({
			title: page.url.pathname.startsWith('/pt/') ? 'Copiado!' : 'Copied!',
			description: page.url.pathname.startsWith('/pt/')
				? 'Link copiado para a área de transferência!'
				: 'Link copied to clipboard!'
		});
	}

	const isPortuguese = page.url.pathname.startsWith('/pt/');
</script>

<div class="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-10 md:py-16">
	<div class="flex flex-col items-center gap-4 text-center">
		<Badge variant="info" size="md">{isPortuguese ? 'Rede de Confiança' : 'Web of Trust'}</Badge>
		<h1 class="text-4xl font-extrabold tracking-tight text-[rgb(var(--text))] md:text-5xl">
			{isPortuguese ? 'Grafo de confiança' : 'Trust Graph'}
		</h1>
		<p class="max-w-3xl text-sm text-[rgb(var(--text-muted))] md:text-base">
			{isPortuguese
				? 'Explore como as avaliações conectam pessoas pela rede e compartilhe visões filtradas do grafo.'
				: 'Explore how ratings connect people across the network and share filtered graph views.'}
		</p>
	</div>

	<Card class="flex w-full flex-wrap items-center justify-center gap-4">
		<div class="flex flex-col">
			<Label for="filterFrom" class="font-semibold pb-1 text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por quem avaliou' : 'Filter by who rated'}
				{userPubkey && pubkey === userPubkey ? (isPortuguese ? '(Você)' : '(You)') : ''}:
			</Label>
			<Input
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
				id="filterFrom"
				placeholder={isPortuguese ? 'Digite o npub de quem avaliou' : 'Enter rater npub'}
				bind:value={npub}
				autocomplete="off"
			/>
			{#if processNpubError}
				<Helper class="mt-2" color="red">
					<span class="font-bold">{isPortuguese ? 'npub inválido' : 'Invalid npub'}</span>
				</Helper>
			{/if}
		</div>

		<div class="flex flex-col">
			<Label for="filterTo" class="font-semibold pb-1 text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por quem foi avaliado:' : 'Filter by who was rated:'}
			</Label>
			<Input
				class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
				id="filterTo"
				placeholder={isPortuguese ? 'Digite o npub de quem foi avaliado' : 'Enter rated npub'}
				bind:value={targetNpub}
				autocomplete="off"
			/>
			{#if processTargetNpubError}
				<Helper class="mt-2" color="red">
					<span>{isPortuguese ? 'npub inválido' : 'Invalid npub'}</span>
				</Helper>
			{/if}
		</div>

		<div class="flex flex-col">
			<Label for="filterReview" class="font-semibold pb-1 text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por avaliações:' : 'Filter by ratings:'}
			</Label>
			<div class="flex flex-row items-center gap-x-3">
				<Select
					class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
					id="filterReview"
					bind:value={ratingScoreFilter}
					items={[
						{ value: 'all', name: isPortuguese ? 'Todas' : 'All' },
						{ value: 'positive', name: isPortuguese ? 'Positivas' : 'Positive' },
						{ value: 'negative', name: isPortuguese ? 'Negativas' : 'Negative' }
					]}
				/>
			</div>
		</div>

		<div class="flex flex-col">
			<Label for="filterReview" class="font-semibold pb-1 text-[rgb(var(--text))]">
				{isPortuguese ? 'Filtrar por já ter feito negócio:' : 'Filter by had business:'}
			</Label>
			<div class="flex flex-row items-center gap-x-3">
				<Select
					class="rounded-xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-2))] text-[rgb(var(--text))]"
					id="filterReview"
					bind:value={ratingHadBusinessFilter}
					items={[
						{ value: 'all', name: isPortuguese ? 'Todas' : 'All' },
						{ value: 'yes', name: isPortuguese ? 'Sim' : 'Yes' },
						{ value: 'no', name: isPortuguese ? 'Não' : 'No' }
					]}
				/>
			</div>
		</div>

		<div class="flex flex-col">
			<Label class="flex items-center gap-2 text-[rgb(var(--text))]">
				<Checkbox
					bind:checked={physicsEnabled}
					class="!bg-[rgb(var(--surface-2))] checked:!bg-pls-blue-500"
				/>
				{isPortuguese ? 'Física ativada' : 'Physics enabled'}
			</Label>
		</div>

		<div class="flex flex-col">
			<Button variant="outline" on:click={() => copyLinkToClipboard()}>
				{isPortuguese ? 'Compartilhar esta visão' : 'Share this view'}
			</Button>
		</div>
	</Card>

	<div class="relative w-full">
		<RenderGraph
			bind:source={pubkey}
			bind:target={targetPubkey}
			bind:this={renderGraph}
			bind:ratingScoreFilter
			bind:ratingHadBusinessFilter
			bind:physicsEnabled
			{userPubkey}
			{nodeWidths}
			{edgeWidths}
			{graph}
		/>

		{#if (pubkey || targetPubkey) && graphLoading && !graphHasData}
			<div
				class="pointer-events-none absolute inset-0 flex items-center justify-center"
				aria-live="polite"
			>
				<div
					class="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))]/80 px-5 py-3 text-sm text-[rgb(var(--text-muted))] backdrop-blur"
				>
					<span
						class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[rgb(var(--border-strong))] border-t-pls-blue-400"
					></span>
					{isPortuguese ? 'Buscando avaliações na rede…' : 'Fetching ratings from the network…'}
				</div>
			</div>
		{/if}

		{#if (pubkey || targetPubkey) && !graphLoading && !graphHasData}
			<div
				class="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
				aria-live="polite"
			>
				<div
					class="max-w-md rounded-2xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))]/85 px-6 py-5 text-center backdrop-blur"
				>
					<h3 class="text-base font-semibold text-[rgb(var(--text))]">
						{isPortuguese ? 'Nenhuma avaliação encontrada' : 'No ratings found'}
					</h3>
					<p class="mt-2 text-sm text-[rgb(var(--text-muted))]">
						{isPortuguese
							? 'Esta identidade ainda não publicou nem recebeu avaliações nos relays consultados. Tente outro npub ou aguarde novos eventos.'
							: 'This identity has not published or received ratings on the relays we query. Try another npub or wait for new events.'}
					</p>
				</div>
			</div>
		{/if}
	</div>
</div>
