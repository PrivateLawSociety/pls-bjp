import type { Rating } from '$lib/wot/nostr';

export interface GraphRating extends Rating {
	parentRatings: GraphRating[];
	childrenRatings: GraphRating[];
	currentDepth: number;
}

export const RatingFilterScoreTypes = ['positive', 'negative', 'all'] as const;

export type RatingFilterScoreType = (typeof RatingFilterScoreTypes)[number];

export function isRatingFilterScore(filter: string): filter is RatingFilterScoreType {
	return RatingFilterScoreTypes.includes(filter as RatingFilterScoreType);
}

export const RatingFilterHadBusinessTypes = ['yes', 'no', 'all'] as const;

export type RatingFilterHadBusinessType = (typeof RatingFilterHadBusinessTypes)[number];

export function isRatingFilterHadBusiness(filter: string): filter is RatingFilterHadBusinessType {
	return RatingFilterHadBusinessTypes.includes(filter as RatingFilterHadBusinessType);
}

export type NodeDataType = 'source' | 'target' | 'common';

export interface NodeData {
	displayName?: string;
	picture?: string;
}

export interface EdgeData {
	from: string;
	to: string;
	score: boolean;
	businessAlreadyDone: boolean;
	description: string;
}
