import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// pls-lib package aliases live in vite.config.ts (resolve.alias) instead of
// kit.alias. That keeps the runtime alias without generating tsconfig paths,
// so the ambient declarations in src/pls-lib-ambient.d.ts can type-check
// these modules as `any` and prevent svelte-check from following third-party
// source files we can't modify.

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess({})],
	kit: {
		adapter: adapter({ runtime: 'nodejs22.x' }),
		prerender: {
			// /wot is added in a later phase; /bjp routes are client-only (ssr=false).
			// When prerendering /, the crawler may follow links to those routes and
			// get 404s because they don't render on the server — ignore them instead
			// of failing the build.
			handleHttpError: ({ status, path, message }) => {
				if (status === 404 && (path.startsWith('/wot') || path.startsWith('/bjp'))) {
					return;
				}
				throw new Error(message);
			}
		}
	}
};

export default config;
