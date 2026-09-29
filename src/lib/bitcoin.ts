import * as bitcoin from 'bitcoinjs-lib';
import * as liquid from 'liquidjs-lib';

import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { toXOnly } from 'bitcoinjs-lib/src/psbt/bip371';

export const ECPair = ECPairFactory(ecc);

bitcoin.initEccLib(ecc);

// Tweak should have exactly 32 bytes. Perhaps a hash
export function tweakPublicKey(pubkey: Buffer, tweak: Buffer) {
	const xOnlyPubkey = toXOnly(pubkey);

	const tweakedPubkey = ecc.xOnlyPointAddTweak(xOnlyPubkey, tweak);

	if (!tweakedPubkey) throw new Error('Cannot tweak public key');

	const parityByte = Buffer.from([tweakedPubkey.parity ? 0x02 : 0x03]);

	return Buffer.concat([parityByte, Buffer.from(tweakedPubkey.xOnlyPubkey)]);
}

export const networkNames = ['bitcoin', 'bitcoin_testnet', 'liquid', 'liquid_testnet'] as const;

export type NetworkNames = (typeof networkNames)[number];

// Invalid point, there is not priv key to sign this, should be random.
// It's being maintained for compatibility purposes
// Should be removed in future pls-bitcoin-lib versions or at least optional
export const internalPubkey = Uint8Array.from(Buffer.from(
	"0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0",
	"hex"
));

export const multisigNetworks = ['bitcoin', 'testnet'] as const;

export type MultisigNetwork = (typeof multisigNetworks)[number];

export function isValidNetworkName(name: string): name is NetworkNames {
	return networkNames.includes(name as NetworkNames);
}

export function getNetworkByName(networkName: NetworkNames): { isTestnet: boolean } & (
	| {
	isLiquid: false;
	network: bitcoin.networks.Network;
	name: 'bitcoin' | 'bitcoin_testnet';
}
	| {
	isLiquid: true;
	network: liquid.networks.Network;
	name: 'liquid' | 'liquid_testnet';
}
	) {
	if (networkName === 'bitcoin')
		return {
			isLiquid: false,
			isTestnet: false,
			network: bitcoin.networks.bitcoin,
			name: networkName
		};
	else if (networkName === 'bitcoin_testnet')
		return {
			isLiquid: false,
			isTestnet: true,
			network: bitcoin.networks.testnet,
			name: networkName
		};
	else if (networkName === 'liquid')
		return {
			isLiquid: true,
			isTestnet: false,
			network: liquid.networks.liquid,
			name: networkName
		};
	else if (networkName === 'liquid_testnet')
		return {
			isLiquid: true,
			isTestnet: true,
			network: liquid.networks.testnet,
			name: networkName
		};

	throw new Error('It should be impossible to get here');
}

export function getMultisigNetworkByNetworkName(networkName: NetworkNames): MultisigNetwork {
	const networks: { [key in NetworkNames]?: MultisigNetwork } = {
		bitcoin: 'bitcoin',
		bitcoin_testnet: 'testnet',
	};

	const network = networks[networkName];

	if (network === undefined) {
		throw new Error('Invalid network for bitcoin multisig: ${networkName}');
	}

	return network;
}
