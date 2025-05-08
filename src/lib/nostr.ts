import {
	getPublicKey,
	SimplePool,
	type Event,
	generateSecretKey,
	nip04,
	finalizeEvent
} from 'nostr-tools';
import { get, writable } from 'svelte/store';
import { ECPair, getNetworkByName, type NetworkNames } from './bitcoin';
import { Buffer } from 'buffer';

export const relayPool = new SimplePool();

export const relayList = [
	'wss://nostr-pub.wellorder.net',
	'wss://relay.nostr.band',
	'wss://relay.damus.io',
	'wss://nostr.fmt.wiz.biz',
	'wss://offchain.pub',
	'wss://relay.current.fyi',
	'wss://nos.lol'
];

export async function makeNostrEvent(
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

export function nostrNowAdjusted() {
	return nostrNowBasic() - 60 * 2; // 2 minutes before, to work around clock drift
}

export function nostrNowBasic() {
	return Math.floor(Date.now() / 1000);
}

export function broadcastToNostr(event: Event) {
	return relayPool.publish(relayList, event);
}

export function getOldestEvent(events: Event[]) {
	const ascendingEvents = events.sort((a, b) => a.created_at - b.created_at);

	const lastEvent = ascendingEvents[ascendingEvents.length - 1];

	return lastEvent;
}

export function nostrEncryptDmFactory(privkey: string) {
	return {
		async encryptDM(otherPubkey: string, text: string) {
			return await nip04.encrypt(privkey, otherPubkey, text);
		},
		async decryptDM(otherPubkey: string, text: string) {
			return await nip04.decrypt(privkey, otherPubkey, text);
		}
	};
}

export let nostrAuth = (() => {
	let initialPrivateKey = sessionStorage.getItem('private-key');

	const store = writable<{ privkey: string; pubkey: string } | null>(
		initialPrivateKey
			? {
					privkey: initialPrivateKey,
					pubkey: getPublicKey(Uint8Array.from(Buffer.from(initialPrivateKey, 'hex')))
			  }
			: null
	);

	store.subscribe((keys) => {
		if (keys?.privkey) sessionStorage.setItem('private-key', keys.privkey);
	});

	function loginWithRandomKeys() {
		const privkey = generateSecretKey();
		const privkeyStr = Buffer.from(privkey).toString('hex');
		const pubkey = getPublicKey(privkey);

		navigator.clipboard.writeText(
			`private key: ${privkey}
public key: ${pubkey}`
		);

		store.set({
			privkey: privkeyStr,
			pubkey
		});

		return true;
	}

	return {
		signOut() {
			store.set(null);
			sessionStorage.removeItem('private-key');
		},
		loginWithRandomKeys,
		loginWithPrivkey(privkey: string) {
			const pubkey = getPublicKey(Uint8Array.from(Buffer.from(privkey, 'hex')));

			store.set({
				privkey,
				pubkey
			});
		},
		getPrivkey() {
			return get(store)?.privkey;
		},
		async tryLogin() {
			if (get(store)?.privkey) return true;

			return loginWithRandomKeys();
		},
		...nostrEncryptDmFactory(get(store)?.privkey as string),
		async makeEvent(kind: number, content: string, tags: string[][]) {
			const { privkey } = get(store)!;

			return makeNostrEvent(privkey, kind, content, tags);
		},
		getSigner(networkName: NetworkNames) {
			const { privkey } = get(store)!;

			if (privkey) {
				const ecpair = ECPair.fromPrivateKey(Buffer.from(privkey, 'hex'), {
					network: getNetworkByName(networkName).network
				});

				return ecpair;
			}
		},
		subscribe: store.subscribe
	};
})();
