import { type Event, finalizeEvent, nip04, SimplePool } from 'nostr-tools';
import { ECPair, getNetworkByName, type NetworkNames } from './bitcoin';
import { Buffer } from 'buffer';
import { nostrAuth } from './auth';

// Auth state lives in $lib/auth so it can be imported from the SSR-safe
// root +layout.svelte without pulling in bitcoinjs. This re-export keeps
// existing call sites working.
export { nostrAuth };

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

export function nostrEncryptDmFactory(privkey: string | undefined) {
	return {
		async encryptDM(otherPubkey: string, text: string) {
			if (privkey) {
				return await nip04.encrypt(privkey, otherPubkey, text);
			} else {
				return await window.nostr!.nip04.encrypt(otherPubkey, text);
			}
		},
		async decryptDM(otherPubkey: string, text: string) {
			if (privkey) {
				return await nip04.decrypt(privkey, otherPubkey, text);
			} else {
				return await window.nostr!.nip04.decrypt(otherPubkey, text);
			}
		}
	};
}

// getSigner returns a bitcoinjs-lib-compatible signer using either the
// in-memory private key or a NIP-07 browser extension. It lives here
// instead of on nostrAuth itself because it depends on bitcoinjs — and
// nostrAuth has to stay SSR-safe (see $lib/auth).
export function getSigner(networkName: NetworkNames) {
	const pubkey = nostrAuth.getPubkey();
	const privkey = nostrAuth.getPrivkey();

	if (privkey) {
		return ECPair.fromPrivateKey(Buffer.from(privkey, 'hex'), {
			network: getNetworkByName(networkName).network
		});
	}

	if (pubkey) {
		if (!window.nostr?.signSchnorr) {
			alert("Your extension doesn't support signing");
			return undefined;
		}

		return {
			publicKey: Buffer.from('02' + pubkey, 'hex'),
			sign() {
				throw new Error('Signing without schnorr is not possible with the extension');
			},
			async signSchnorr(hash: Buffer) {
				return Buffer.from(await window.nostr!.signSchnorr(hash.toString('hex')), 'hex');
			}
		};
	}

	return undefined;
}
