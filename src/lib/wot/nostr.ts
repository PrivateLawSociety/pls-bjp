import { SimplePool, type Event } from 'nostr-tools';
import { Metadata } from 'nostr-tools/kinds';
import { decode, npubEncode } from 'nostr-tools/nip19';
import { getZapEndpoint, makeZapRequest } from 'nostr-tools/nip57';

import { get, writable } from 'svelte/store';

// Auth state is shared with the BJP app via $lib/nostr. We re-export it
// here so existing WoT imports keep working while a login performed in
// one section (BJP or WoT) is immediately visible in the other — the
// previous duplicate stores only synced through sessionStorage, which
// doesn't notify subscribers in the same tab.
export { nostrAuth } from '$lib/nostr';

export let relayPool = new SimplePool();

export let relayList = [
	'wss://nostr-pub.wellorder.net',
	'wss://relay.nostr.band',
	'wss://relay.damus.io',
	'wss://nostr.fmt.wiz.biz',
	'wss://offchain.pub',
	'wss://relay.current.fyi',
	'wss://nos.lol'
];

export interface Rating {
	eventId: string;
	from: ProfileType;
	to: ProfileType;
	date: number;
	score: boolean;
	businessAlreadyDone: boolean;
	description: string;
}

export interface ProfileType {
	npub: string;
	name?: string;
	picture?: string;
	banner?: string;
	about?: string;
	nip05?: string;
	website?: string;
	lud16?: string;
	pubkey: string;
	display_name?: string;
	displayName?: string;
}

export function parseProfileFromJsonString(
	content: string,
	profile: Partial<ProfileType> & { pubkey: string }
) {
	let metadata = {} as any;
	metadata = JSON.parse(content || '{}');

	if (!profile.npub) {
		profile.npub = npubEncode(profile.pubkey);
	}

	const targetProfile = Object.assign({}, profile) as ProfileType;

	targetProfile.name = metadata?.name || '';
	targetProfile.picture = metadata?.picture || '';
	targetProfile.banner = metadata?.banner || '';
	targetProfile.about = metadata?.about || '';
	targetProfile.nip05 = metadata?.nip05 || '';
	targetProfile.website = metadata?.website || '';
	targetProfile.lud16 = metadata?.lud16 || '';
	targetProfile.display_name = metadata?.display_name || '';
	targetProfile.displayName = metadata?.displayName || '';

	return targetProfile;
}

export function broadcastToNostr(event: Event) {
	return relayPool.publish(relayList, event);
}

export const profilesMetadata = writable<Record<string, Event>>({});
export const getProfileMetadata = async (publicKey: string): Promise<Event | null> => {
	try {
		async function queryMetadata() {
			const metadataEvent = await relayPool.get(relayList, {
				kinds: [Metadata],
				authors: [publicKey],
				limit: 1
			});

			if (metadataEvent) {
				const olderProfile = get(profilesMetadata)[publicKey];

				const olderCreatedAt = olderProfile?.created_at || 0;

				if (olderCreatedAt < metadataEvent?.created_at) {
					profilesMetadata.update((profiles) => {
						profiles[publicKey] = metadataEvent;

						return profiles;
					});
				}
			}

			const profileMetadata = get(profilesMetadata)[publicKey];

			return profileMetadata;
		}

		const profiles = get(profilesMetadata);

		const olderProfile = profiles[publicKey];

		if (olderProfile) {
			// It ensures that the latest
			queryMetadata();

			return olderProfile;
		}

		return await queryMetadata();
	} catch (error) {
		console.error('Unable get profile metadata', error);
		return null;
	}
};

export const createInvoice = async (
	destination: string,
	message: string,
	amount: number,
	eventId: string
) => {
	try {
		const publicKey: string = decode(destination).data.toString();
		const profileMetadata = await getProfileMetadata(publicKey);

		if (!profileMetadata) {
			const error = new Error('Unable get profile metadata');
			error.name = 'ProfileMetadata';
			throw error;
		}

		const zapEndpoint = await getZapEndpoint(profileMetadata);

		if (!zapEndpoint) {
			const error = new Error('Unable get profile LUD-16');
			error.name = 'ZapEndpoint';
			throw error;
		}

		// nostr-tools 2.17 split makeZapRequest into ProfileZap ({ pubkey, ... })
		// and EventZap ({ event: NostrEvent, ... }). We only have a rating event
		// id here, not the full NostrEvent — use ProfileZap and keep eventId as
		// a tag on the generated event below if needed. Unused for now.
		void eventId;
		const zapRequestEvent = makeZapRequest({
			pubkey: publicKey,
			amount: amount,
			relays: relayList,
			comment: message
		});

		const callbackUrl = new URL(zapEndpoint);

		const params = new URLSearchParams({
			...Object.fromEntries(callbackUrl.searchParams),
			comment: message || '',
			amount: Math.floor(amount * 1000).toString(),
			nostr: JSON.stringify(zapRequestEvent)
		});

		const baseUrl = `${callbackUrl.protocol}//${callbackUrl.host}${callbackUrl.pathname}`;

		const invoiceRequest = await fetch(`${baseUrl}?${params}`);

		if (!invoiceRequest.ok) {
			const error = Error('Unable to make request invoice');
			error.name = 'InvoiceRequest';
			throw error;
		}

		return await invoiceRequest.json();
	} catch (error) {
		console.error('Unable to create invoice', error);
		throw error;
	}
};

export const checkPayment = async (verify: string) => {
	try {
		const verifyRequest = await fetch(verify);

		if (!verifyRequest.ok) {
			const error = Error('Unable to make verify invoice request');
			error.name = 'VerifyRequest';
			throw error;
		}

		return await verifyRequest.json();
	} catch (error) {
		console.error('Unable to verify payment', error);
		throw error;
	}
};
