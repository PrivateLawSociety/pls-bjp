<script lang="ts">
	import { onMount } from 'svelte';
	import { DataSet } from 'vis-data';
	import { type Edge, Network, type Node } from 'vis-network';
	import type Graph from 'graphology';
	import type {
		EdgeData,
		NodeData,
		NodeDataType,
		RatingFilterHadBusinessType,
		RatingFilterScoreType
	} from './types';
	import { nip19 } from 'nostr-tools';
	import { toasts } from 'svelte-toasts';
	import { allSimplePaths } from 'graphology-simple-path';
	import { renderVirtualSvelteElement } from '$lib/wot/rendering';
	import GraphRatingText from '$lib/components/GraphRatingText.svelte';

	const renderData = {
		nodes: new DataSet<Node>(),
		edges: new DataSet<Edge>()
	};

	const physics = {
		enabled: true,
		repulsion: {
			centralGravity: 5 * 10 ** -3,
			springLength: 400,
			springConstant: 5 * 10 ** -6,
			nodeDistance: 220,
			damping: 0.3
		},
		solver: 'repulsion',
		stabilization: {
			enabled: true,
			iterations: 300,
			fit: true
		}
	};

	export let userPubkey: string | undefined;

	export let graph: Graph<NodeData, EdgeData>;

	export let source: string | undefined;

	export let target: string | undefined;

	export let ratingScoreFilter: RatingFilterScoreType;

	export let ratingHadBusinessFilter: RatingFilterHadBusinessType;

	export function render() {
		function clearData() {
			renderData.nodes.clear();
			renderData.edges.clear();
		}

		if (!source && !target) {
			return clearData();
		}

		if (source && !graph.hasNode(source)) {
			return clearData();
		}

		if (target && !graph.hasNode(target)) {
			return clearData();
		}

		function getData() {
			function getNodeType(node: string): NodeDataType {
				if (node === source) return 'source';

				if (node === target) return 'target';

				return 'common';
			}

			function defaultData() {
				const filteredGraph = graph.copy();

				const edgesToRemove = new Set<string>();

				const filterEdgeByScoreMap: Record<RatingFilterScoreType, (edgeScore: boolean) => boolean> =
					{
						positive: (edgeScore) => edgeScore === false,
						negative: (edgeScore) => edgeScore === true,
						all: () => false
					};

				const shouldExcludeActionByScore = filterEdgeByScoreMap[ratingScoreFilter];

				const filterEdgeByHadBusinesMap: Record<
					RatingFilterHadBusinessType,
					(edgeHadBusiness: boolean) => boolean
				> = {
					yes: (edgeHadBusiness) => edgeHadBusiness === false,
					no: (edgeHadBusiness) => edgeHadBusiness === true,
					all: () => false
				};

				const shouldExcludeActionByHadBusiness = filterEdgeByHadBusinesMap[ratingHadBusinessFilter];

				filteredGraph.forEachEdge((edge) => {
					const edgeScore = graph.getEdgeAttribute(edge, 'score');

					if (shouldExcludeActionByScore(edgeScore)) {
						edgesToRemove.add(edge);
						return;
					}

					const hadBusiness = graph.getEdgeAttribute(edge, 'businessAlreadyDone');

					if (shouldExcludeActionByHadBusiness(hadBusiness)) {
						edgesToRemove.add(edge);
						return;
					}
				});

				edgesToRemove.forEach((edge) => filteredGraph.dropEdge(edge));

				const nodesToRemove = new Set<string>();

				filteredGraph.forEachNode((node) => {
					if (node === source || node === target) return;

					const degree = filteredGraph.degree(node);

					if (degree <= 0) nodesToRemove.add(node);

					if (source) {
						const possiblePaths = allSimplePaths(filteredGraph, source, node);

						if (possiblePaths.length <= 0) nodesToRemove.add(node);

						return;
					}

					if (target) {
						const possiblePaths = allSimplePaths(filteredGraph, node, target);

						if (possiblePaths.length <= 0) nodesToRemove.add(node);
					}
				});

				nodesToRemove.forEach((node) => filteredGraph.dropNode(node));

				return {
					nodes: filteredGraph.nodes().map((node) => {
						const data = graph.getNodeAttributes(node);

						return {
							...data,
							id: node,
							type: getNodeType(node)
						};
					}),
					edges: filteredGraph.edges().map((edge) => {
						const data = graph.getEdgeAttributes(edge);

						return {
							...data,
							id: edge
						};
					})
				};
			}

			if (!source || !target) return defaultData();

			const simplePaths = allSimplePaths(graph, source, target);

			const relevantPaths = simplePaths.filter((pathGroup) => {
				function pathHasProhibitedEdgeAttribute<K extends keyof EdgeData>(
					edgeAttribute: K,
					prohibitedValue: EdgeData[K]
				) {
					for (const i in pathGroup.slice(1)) {
						const previousNodeIndex = Number(i);

						const nodeIndex = Number(i) + 1;

						const node = pathGroup[nodeIndex];

						const previousNode = pathGroup[previousNodeIndex];

						const edgeId = graph.edge(previousNode, node)!;

						const edgeData = graph.getEdgeAttributes(edgeId);

						if (edgeData[edgeAttribute] === prohibitedValue) return true;
					}

					return false;
				}

				const filterByScoreMap: Record<RatingFilterScoreType, () => boolean> = {
					positive: () => pathHasProhibitedEdgeAttribute('score', false),
					negative: () => pathHasProhibitedEdgeAttribute('score', true),
					all: () => false
				};

				const shouldExcludeRouteByScore = filterByScoreMap[ratingScoreFilter];

				if (shouldExcludeRouteByScore()) {
					return false;
				}

				const filterByHadBusinessMap: Record<RatingFilterHadBusinessType, () => boolean> = {
					yes: () => pathHasProhibitedEdgeAttribute('businessAlreadyDone', false),
					no: () => pathHasProhibitedEdgeAttribute('businessAlreadyDone', true),
					all: () => false
				};

				const shouldExcludeRouteByHadBusiness = filterByHadBusinessMap[ratingHadBusinessFilter];

				if (shouldExcludeRouteByHadBusiness()) {
					return false;
				}

				return true;
			});

			const relevantNodes = new Set<string>([source, target]);

			const relevantEdgeCombinations = new Set<string>();

			relevantPaths.forEach((nodeGroup) => nodeGroup.forEach((node) => relevantNodes.add(node)));

			relevantPaths.forEach((path) =>
				path.slice(1).forEach((node, i) => {
					const previousNodeIndex = i;

					const previousNode = path[previousNodeIndex];

					const edgeCombination = `${previousNode}:${node}`;

					relevantEdgeCombinations.add(edgeCombination);
				})
			);

			const nodes = graph
				.filterNodes((node) => relevantNodes.has(node))
				.map((node) => {
					const data = graph.getNodeAttributes(node);

					return {
						...data,
						id: node,
						type: getNodeType(node)
					};
				});

			const edges = graph
				.filterEdges((edge) => {
					const data = graph.getEdgeAttributes(edge);

					const edgeIndex = `${data.from}:${data.to}`;

					return relevantEdgeCombinations.has(edgeIndex);
				})
				.map((edge) => {
					const data = graph.getEdgeAttributes(edge);

					return {
						...data,
						id: edge
					};
				});

			return {
				nodes,
				edges
			};
		}

		const { nodes, edges } = getData();

		if (nodes.length === 0 && edges.length === 0) {
			clearData();
			return;
		}

		nodes.forEach((node) => {
			const displayNameFormatMap = {
				source: (displayName) => {
					const isUserPubkey = userPubkey && node.id === userPubkey;

					const helperText = isUserPubkey ? '(You)' : '(Main rater)';

					const text = displayName ? `${displayName} ${helperText}` : helperText;

					return text;
				},
				target: (displayName) => (displayName ? `${displayName} (Target)` : '(Target)'),
				common: (displayName) => displayName || 'Unknown (No profile name)'
			} as Record<NodeDataType, (displayName?: string) => string>;

			const displayNameGen = displayNameFormatMap[node.type];

			const displayName = displayNameGen(node.displayName);

			renderData.nodes.update({
				id: node.id,
				label: displayName,
				title: displayName,
				image: node.picture || '/avatar.svg',
				group: node.type
			});
		});

		edges.forEach((edge) => {
			const ratingComponent = renderVirtualSvelteElement(GraphRatingText, {
				text: edge.description
			});

			const edgeColor = edge.score ? '#22c55e' : '#ef4444';

			renderData.edges.update({
				id: edge.id,
				from: edge.from,
				to: edge.to,
				color: {
					color: edgeColor,
					highlight: edgeColor,
					hover: edgeColor,
					opacity: 0.85
				},
				dashes: edge.businessAlreadyDone ? undefined : [2, 2, 10, 10],
				title: ratingComponent
			});
		});

		function clearOldNodes() {
			if (nodes.length === renderData.nodes.length) return;

			const nodeIds = nodes.map((node) => node.id!);

			const excludedNodeIds = renderData.nodes
				.map((node) => node.id!)
				.filter((node) => !nodeIds.includes(node as string));

			renderData.nodes.remove(excludedNodeIds);
		}

		function clearOldEdges() {
			if (edges.length === renderData.edges.length) return;

			const edgeIds = edges.map((edge) => edge.id!);

			const excludedEdgeIds = renderData.edges
				.map((edge) => edge.id!)
				.filter((edge) => !edgeIds.includes(edge as string));

			renderData.edges.remove(excludedEdgeIds);
		}

		clearOldNodes();
		clearOldEdges();
	}

	$: (ratingScoreFilter, ratingHadBusinessFilter, source, target, render());

	interface HoverWidths {
		width: number;
		hoverWidth: number;
	}

	export let nodeWidths: HoverWidths;

	export let edgeWidths: HoverWidths;

	export let physicsEnabled: boolean;

	let graphContainer: HTMLDivElement;

	let network: Network | undefined;

	interface TogglePhysicsParams {
		physicsEnabled: boolean;
	}

	function togglePhysics({ physicsEnabled }: TogglePhysicsParams) {
		network?.setOptions({
			physics: physicsEnabled ? physics : false
		});
	}

	$: togglePhysics({ physicsEnabled });

	onMount(() => {
		network = new Network(graphContainer, renderData, {
			physics: physicsEnabled ? physics : false,
			autoResize: true,
			nodes: {
				shape: 'circularImage',
				font: {
					size: 32,
					color: '#e6edf3',
					strokeWidth: 4,
					strokeColor: '#0a0a0f'
				},
				brokenImage: '/avatar.svg',
				chosen: false,
				color: {
					border: '#6b7891',
					background: '#1b2432',
					highlight: { border: '#4b8bf5', background: '#1b2432' }
				},
				borderWidth: nodeWidths.width,
				borderWidthSelected: nodeWidths.hoverWidth
			},
			groups: {
				source: {
					size: 96,
					color: {
						border: '#4b8bf5',
						background: '#0b1a33',
						highlight: { border: '#6ba6ff', background: '#0b1a33' }
					}
				},
				target: {
					size: 96,
					color: {
						border: '#f5c542',
						background: '#2a2210',
						highlight: { border: '#ffd866', background: '#2a2210' }
					}
				},
				common: {
					size: 56,
					color: {
						border: '#6b7491',
						background: '#1b2432',
						highlight: { border: '#8a95ac', background: '#1b2432' }
					}
				}
			},
			edges: {
				width: edgeWidths.width,
				selectionWidth: 3,
				arrows: {
					to: { enabled: true, scaleFactor: 1.4 }
				},
				chosen: false,
				smooth: {
					type: 'dynamic',
					enabled: true,
					forceDirection: 'none',
					roundness: 0.5
				}
			},
			interaction: {
				hover: true,
				tooltipDelay: 150,
				navigationButtons: true,
				keyboard: true,
				zoomView: true,
				dragView: true
			}
		});

		network.on('hoverNode', (event) => {
			const nodeId = event.node as string;

			renderData.nodes.update({
				id: nodeId,
				borderWidth: nodeWidths.hoverWidth
			});
		});

		network.on('blurNode', (event) => {
			const nodeId = event.node as string;

			renderData.nodes.update({
				id: nodeId,
				borderWidth: nodeWidths.width
			});
		});

		network.on('hoverEdge', (event) => {
			const edgeId = event.edge as string;

			renderData.edges.update({
				id: edgeId,
				width: edgeWidths.hoverWidth
			});
		});

		network.on('blurEdge', (event) => {
			const edgeId = event.edge as string;

			renderData.edges.update({
				id: edgeId,
				width: edgeWidths.width
			});
		});

		network.on('click', async (event) => {
			const nodes = event.nodes as string[];

			const edges = event.edges as string[];

			function getActionType() {
				if (nodes.length === 1) return 'pubkey';

				if (edges.length === 1) return 'rating';
			}

			const actionType = getActionType();

			if (!actionType) return;

			const actions = {
				pubkey: async () => {
					const [node] = nodes;

					const npub = nip19.npubEncode(node);

					await navigator.clipboard.writeText(npub);

					toasts.success({
						title: 'Copied!',
						description: 'NPUB copied to clipboard!'
					});
				},
				rating: async () => {
					const [edge] = edges;

					const edgeData = graph.getEdgeAttributes(edge);

					const fromNpub = nip19.npubEncode(edgeData.from as string);

					const toNpub = nip19.npubEncode(edgeData.to as string);

					const url = new URL('/table', window.location.origin);

					url.searchParams.set('rater', fromNpub);

					url.searchParams.set('rated', toNpub);

					window.open(url.toString(), '_blank');
				}
			} as Record<typeof actionType, () => Promise<void>>;

			await actions[actionType]?.();
		});

		network.moveTo({ position: { x: 0, y: 0 }, scale: 0.5 });
	});
</script>

<div
	bind:this={graphContainer}
	class="h-[78vh] min-h-[560px] w-full rounded-2xl border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface))]"
></div>

<style>
	/* Recolor vis-network's built-in navigation buttons so they stay readable
	   on both themes. The default sprites are saturated-green arrows on green
	   circles — unreadable against a dark canvas, and still muddy on a light
	   one. We strip their native colors and repaint per theme. */
	:global(div.vis-network div.vis-navigation div.vis-button) {
		opacity: 0.6;
		border-radius: 8px;
		transition:
			opacity 0.15s ease,
			background-color 0.15s ease;
	}

	:global(html.dark div.vis-network div.vis-navigation div.vis-button) {
		filter: brightness(0) invert(1);
		background-color: rgba(255, 255, 255, 0.06);
	}

	:global(html:not(.dark) div.vis-network div.vis-navigation div.vis-button) {
		filter: brightness(0);
		background-color: rgba(0, 0, 0, 0.06);
	}

	:global(div.vis-network div.vis-navigation div.vis-button:hover) {
		opacity: 1;
	}

	:global(html.dark div.vis-network div.vis-navigation div.vis-button:hover) {
		background-color: rgba(75, 139, 245, 0.2);
	}

	:global(html:not(.dark) div.vis-network div.vis-navigation div.vis-button:hover) {
		background-color: rgba(75, 139, 245, 0.15);
	}
</style>
