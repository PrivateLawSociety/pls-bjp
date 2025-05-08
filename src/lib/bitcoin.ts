import * as bitcoin from 'bitcoinjs-lib';
import * as liquid from 'liquidjs-lib';

import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

export const ECPair = ECPairFactory(ecc);

bitcoin.initEccLib(ecc);

export const bitcoinNetworkNames = ['bitcoin', 'bitcoin_testnet'] as const;

export type BitcoinNetworkNames = (typeof bitcoinNetworkNames)[number];

export const liquidNetworkNames = ['liquid', 'liquid_testnet'] as const;

export type LiquidNetworkNames = (typeof liquidNetworkNames)[number];

export const networkNames = [...bitcoinNetworkNames, ...liquidNetworkNames] as const;

export type NetworkNames = (typeof networkNames)[number];

export function isValidNetworkName(name: string): name is NetworkNames {
	return networkNames.includes(name as NetworkNames);
}

export function isLiquidNetworkName(networkName: NetworkNames): networkName is LiquidNetworkNames {
	return liquidNetworkNames.includes(networkName as LiquidNetworkNames);
}

export function isBitcoinNetworkName(networkName: NetworkNames): networkName is BitcoinNetworkNames {
	return bitcoinNetworkNames.includes(networkName as BitcoinNetworkNames);
}

export function getNetworkByName(networkName: NetworkNames): { isTestnet: boolean } & (
	| {
			isLiquid: false;
			network: bitcoin.networks.Network;
			name: BitcoinNetworkNames;
	  }
	| {
			isLiquid: true;
			network: liquid.networks.Network;
			name: LiquidNetworkNames;
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
