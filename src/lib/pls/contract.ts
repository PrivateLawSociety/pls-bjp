import { type LiquidNetworkNames, isLiquidNetworkName, type BitcoinNetworkNames, isBitcoinNetworkName } from '$lib/bitcoin';
import type { ECPairInterface } from 'ecpair';
import { createKeyTweaker } from 'pls-bitcoin';
import { hashFromJSON } from 'pls-core';
import { toXOnly } from "bitcoinjs-lib/src/psbt/bip371";

import {
	contractSchema,
	type Contract,
	type UnsignedContract,
	unsignedContractSchema
} from 'pls-full';

export function tryParseFinishedContract(stringifiedContract: string) {
	try {
		const json = JSON.parse(stringifiedContract);
		const parsed = contractSchema.safeParse(json);

		if (parsed.success) {
			return parsed.data;
		} else {
			alert('Error validating contract');
			console.log(parsed.error);
			return null;
		}
	} catch {
		return null;
	}
}

/**
 * @description This ensures that other fields are excluded, so that they don't affect the final hash
 */
function getMinimalUnsignedContract(unsignedContract: UnsignedContract): UnsignedContract {
	return unsignedContractSchema.strip().parse(unsignedContract);
}

export async function signContract(
	signer: {
		signSchnorr(hash: Buffer): Promise<Buffer> | Buffer;
	},
	unsignedContract: UnsignedContract
) {
	const signature = await signer.signSchnorr(
		hashFromJSON(getMinimalUnsignedContract(unsignedContract))
	);

	return signature;
}

export function verifyContract(keypair: ECPairInterface, contract: Contract, signature: Buffer) {
	return keypair.verifySchnorr(hashFromJSON(getMinimalUnsignedContract(contract)), signature);
}

export function tweakContractPubkey(fileHash: string, pubkey: string) {
	const pubkeyBuffer = Buffer.from('02' + pubkey, 'hex');
	const tweak = Buffer.from(fileHash, 'hex');

	const tweaker = createKeyTweaker({
		pubkey: pubkeyBuffer,
	});

	const tweakedPubkey = toXOnly(tweaker.tweakPubkey(tweak));

	return tweakedPubkey.toString('hex');
}

type BitcoinNetworkContract = Omit<Contract, "collateral"> & {
	collateral: Extract<Contract['collateral'], {
		network: BitcoinNetworkNames
	}>
}

export function isBitcoinNetworkContract(contract: Contract): contract is BitcoinNetworkContract {
	return isBitcoinNetworkName(contract.collateral.network);
}

type LiquidNetworkContract = Omit<Contract, "collateral"> & {
	collateral: Extract<Contract['collateral'], {
		network: LiquidNetworkNames
	}>
}

export function isLiquidNetworkContract(contract: Contract): contract is LiquidNetworkContract {
	return isLiquidNetworkName(contract.collateral.network);
}
