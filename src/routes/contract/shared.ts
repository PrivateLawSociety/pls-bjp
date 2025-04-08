import { type NetworkNames } from '$lib/bitcoin';

// maker ---> takers
export interface ContractRequestPayload {
	arbitratorPubkeys: string[];
	arbitratorsQuorum: number;
	clientPubkeys: string[];
	fileHash: string;
	network: NetworkNames;
}

// // taker ---> maker + other takers
export interface ContractApprovalPayload {
	signature: string;
	fileHash: string;
}

// these events are non-standard, I made them up for the purposes of PLS
// events with values between 1000 and 9999 are regular and can be retrieved any time
// see https://nips.nostr.com/1#kinds
export const ContractRequestEvent = 1370;
export const ContractApprovalEvent = 1371;
