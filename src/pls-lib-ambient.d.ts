// Ambient module declarations for pls-lib subpackages — typed as `any`.
// Runtime resolution is handled by vite.config.ts `resolve.alias`; keeping the
// aliases out of svelte.config.js prevents svelte-kit from generating tsconfig
// `paths` that would make svelte-check follow third-party .ts sources and
// surface Buffer vs Uint8Array mismatches tightened by TS 5.9.

declare module 'pls-bitcoin';
declare module 'pls-core';
declare module 'pls-liquid';
declare module 'pls-nostr';

declare module 'pls-full' {
	export type Contract = any;
	export type UnsignedContract = any;
	export const contractSchema: any;
	export const unsignedContractSchema: any;
}
