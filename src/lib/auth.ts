// SSR-safe auth store + lightweight profile fetcher.
//
// This module intentionally avoids any bitcoinjs-lib / liquidjs-lib /
// secp256k1-zkp imports so it can be loaded from the prerendered root
// +layout.svelte. The BJP and WoT `nostr` modules re-export `nostrAuth`
// from here so a login performed in one section of the app is
// immediately visible in the other (previously two separate stores
// only synced through sessionStorage, which doesn't notify subscribers
// within the same tab).
import { browser } from '$app/environment';
import { Buffer } from 'buffer';
import {
	finalizeEvent,
	generateSecretKey,
	getPublicKey,
	nip04,
	SimplePool,
	type Event
} from 'nostr-tools';
import { Metadata } from 'nostr-tools/kinds';
import { get, writable } from 'svelte/store';

const STORAGE_KEY = 'private-key';

const DEFAULT_RELAYS = [
	'wss://nostr-pub.wellorder.net',
	'wss://relay.nostr.band',
	'wss://relay.damus.io',
	'wss://nostr.fmt.wiz.biz',
	'wss://offchain.pub',
	'wss://nos.lol'
];

interface AuthState {
	privkey?: string;
	pubkey: string;
}

function readInitial(): AuthState | null {
	if (!browser) return null;
	const privkey = sessionStorage.getItem(STORAGE_KEY);
	if (!privkey) return null;
	try {
		return {
			privkey,
			pubkey: getPublicKey(Uint8Array.from(Buffer.from(privkey, 'hex')))
		};
	} catch {
		return null;
	}
}

const store = writable<AuthState | null>(readInitial());

if (browser) {
	store.subscribe((keys) => {
		if (keys?.privkey) sessionStorage.setItem(STORAGE_KEY, keys.privkey);
	});
}

function nostrNowBasic() {
	return Math.floor(Date.now() / 1000);
}

async function makeEventFromPrivkey(
	privkey: string,
	kind: number,
	content: string,
	tags: string[][]
) {
	return finalizeEvent(
		{
			content,
			created_at: nostrNowBasic(),
			kind,
			tags
		},
		Uint8Array.from(Buffer.from(privkey, 'hex'))
	);
}

function loginWithRandomKeys() {
	const privkeyBytes = generateSecretKey();
	const privkey = Buffer.from(privkeyBytes).toString('hex');
	const pubkey = getPublicKey(privkeyBytes);

	if (browser) {
		navigator.clipboard.writeText(`private key: ${privkey}\npublic key: ${pubkey}`);

		alert(
			'Using a nostr extension such as getalby.com is recommended, but a keypair was copied to your clipboard so you can try out PLS without it'
		);
	}

	store.set({ privkey, pubkey });

	return true;
}

export const nostrAuth = {
	subscribe: store.subscribe,
	signOut() {
		store.set(null);
		if (browser) sessionStorage.removeItem(STORAGE_KEY);
	},
	loginWithRandomKeys,
	loginWithPrivkey(privkey: string) {
		const pubkey = getPublicKey(Uint8Array.from(Buffer.from(privkey, 'hex')));
		store.set({ privkey, pubkey });
	},
	getPrivkey() {
		return get(store)?.privkey;
	},
	getPubkey() {
		return get(store)?.pubkey;
	},
	async tryLogin() {
		if (get(store)?.pubkey) return true;

		if (browser && window.nostr) {
			try {
				const pubkey: string = await window.nostr.getPublicKey();
				store.set({ pubkey });
				return true;
			} catch {
				return loginWithRandomKeys();
			}
		}

		return loginWithRandomKeys();
	},
	async encryptDM(otherPubkey: string, text: string) {
		const privkey = get(store)?.privkey;
		if (privkey) return await nip04.encrypt(privkey, otherPubkey, text);
		return await window.nostr!.nip04.encrypt(otherPubkey, text);
	},
	async decryptDM(otherPubkey: string, text: string) {
		const privkey = get(store)?.privkey;
		if (privkey) return await nip04.decrypt(privkey, otherPubkey, text);
		return await window.nostr!.nip04.decrypt(otherPubkey, text);
	},
	async makeEvent(kind: number, content: string, tags: string[][]) {
		const state = get(store)!;
		if (state.privkey) {
			return makeEventFromPrivkey(state.privkey, kind, content, tags);
		}
		const blankEvent = {
			kind,
			content,
			created_at: nostrNowBasic(),
			tags,
			pubkey: state.pubkey
		} as Event;
		return window.nostr!.signEvent(blankEvent);
	}
};

// Lazy profile fetcher used by the header avatar. A local SimplePool is
// used here so this module stays SSR-safe (we never create it outside
// the browser). The same relays are duplicated in $lib/nostr / $lib/wot
// for now — an evolution step would be to centralize them too.
export interface Person {
	picture?: string;
	name?: string;
	displayName?: string;
}

let authPool: SimplePool | null = null;

function getAuthPool(): SimplePool {
	if (!authPool) authPool = new SimplePool();
	return authPool;
}

const peopleStore = writable<Record<string, Person | undefined>>({});

async function fetchPerson(pubkey: string) {
	if (!browser) return;
	const current = get(peopleStore)[pubkey];
	if (current) return;

	try {
		const pool = getAuthPool();
		const events = (await pool.querySync(
			DEFAULT_RELAYS,
			{
				authors: [pubkey],
				kinds: [Metadata],
				limit: 1
			},
			{ maxWait: 4000 }
		)) as Event[];

		if (!events.length) return;

		// pick newest
		const newest = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));
		const metadata = JSON.parse(newest.content || '{}');
		const person: Person = {
			picture: metadata?.picture,
			name: metadata?.name,
			displayName: metadata?.display_name || metadata?.displayName
		};
		peopleStore.update((profiles) => {
			profiles[pubkey] = person;
			return profiles;
		});
	} catch (err) {
		console.error('fetchPerson failed', err);
	}
}

export const people = {
	subscribe: peopleStore.subscribe,
	fetchPerson
};
