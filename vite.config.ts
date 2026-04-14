import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

// pls-lib subpackage aliases live here (not in svelte.config.js kit.alias) so
// that svelte-kit does not leak tsconfig `paths` that would cause svelte-check
// to follow third-party .ts sources. Type checking uses the ambient module
// declarations in src/pls-lib-ambient.d.ts instead.
const plsLibRoot = resolve('./node_modules/pls-lib/packages');

export default defineConfig({
	plugins: [
		tailwindcss(),
		wasm(),
		topLevelAwait(),
		nodePolyfills({
			include: ['buffer', 'crypto', 'events', 'process', 'stream', 'util', 'module'],
			globals: {
				Buffer: true,
				global: true,
				process: true
			},
			protocolImports: true
		}),
		sveltekit()
	],
	resolve: {
		alias: {
			'pls-bitcoin': `${plsLibRoot}/pls-bitcoin/index`,
			'pls-core': `${plsLibRoot}/pls-core/index`,
			'pls-full': `${plsLibRoot}/pls-full/index`,
			'pls-liquid': `${plsLibRoot}/pls-liquid/index`,
			'pls-nostr': `${plsLibRoot}/pls-nostr`
		}
	},
	optimizeDeps: {
		include: [
			'liquidjs-lib',
			'@vulpemventures/secp256k1-zkp',
			'bitcoinjs-lib',
			'crypto',
			'ecpair',
			'tiny-secp256k1',
			'nostr-tools',
			'qrcode-generator',
			'bitcoinjs-lib/src/psbt/bip371',
			'liquidjs-lib/src/psetv2',
			'liquidjs-lib/src/psetv2/utils',
			'liquidjs-lib/src/confidential',
			'liquidjs-lib/src/transaction',
			'liquidjs-lib/src/value',
			'liquidjs-lib/src/issuance',
			'liquidjs-lib/src/asset'
		],
		esbuildOptions: {
			define: {
				global: 'globalThis'
			}
		}
	},
	build: {
		target: 'es2022',
		rollupOptions: {
			external: ['@vulpemventures/secp256k1-zkp']
		}
	}
});
