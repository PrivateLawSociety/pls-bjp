# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bitcoin Justice Protocol (BJP) MVP for the Private Law Society. A SvelteKit app that bundles three things:

1. A **marketing site** at `/` (English) and `/pt` (Portuguese) plus `/manifesto`.
2. The **BJP app** at `/bjp/*` — two parties create decentralized contracts with Bitcoin/Liquid collateral arbitrated via multisig. Signing and contract exchange happen over Nostr; collateral is locked in multisig addresses on Bitcoin or Liquid.
3. The **Web of Trust (WoT)** app at `/wot/*` — Nostr-based rating/graph tooling.

Deployed to Vercel.

## Commands

Package manager is **pnpm** (see `.npmrc`, `pnpm-lock.yaml`).

- `pnpm install` — install deps
- `pnpm run dev` — Vite dev server (append `-- --open` to open browser)
- `pnpm run build` — production build (`@sveltejs/adapter-vercel`, `nodejs22.x`)
- `pnpm run preview` — preview the production build
- `pnpm run check` — `svelte-kit sync` + `svelte-check`
- `pnpm run check:watch` — same in watch mode
- `pnpm run lint` — Prettier check
- `pnpm run format` — Prettier write

There is no test runner configured.

## Architecture

### Rendering model (mixed SSR / client-only)

Unlike the earlier MVP, this app is **not** fully client-only. Rendering mode is decided per section:

- `src/routes/+layout.ts` — `ssr = true`, `prerender = true`. The marketing shell, `/`, `/pt`, `/manifesto` all prerender at build time.
- `src/routes/bjp/+layout.ts` — `ssr = false`, `prerender = false`. All `/bjp/*` routes are browser-only so crypto/key material never touches the server.
- `src/routes/wot/+layout.ts` — `ssr = false`, `prerender = false`. `/wot/*` is browser-only (Nostr + `vis-network`/`sigma`).

When adding a route: if it touches user keys, Nostr subscriptions, or browser-only libs (bitcoinjs-lib, liquidjs-lib, vis-network, sigma), put it under `/bjp` or `/wot` — do **not** add it at the root where prerender will try to crawl it.

`svelte.config.js` configures `prerender.handleHttpError` to swallow 404s under `/bjp` and `/wot` during crawl, so marketing pages can link into the apps without breaking the build.

### i18n (`src/lib/i18n/site.ts`)

Portuguese is served by mirroring the English routes under `/pt`. For each top-level path there is a sibling under `/pt` (e.g. `/bjp/contract/create` has a counterpart `/pt/bjp/contract/create`). The nav switcher uses `getLocaleFromPathname` and `getTopLevelLocalizedPath` to cross-link the two trees; `localizedPaths` inside that file is the canonical list — **when you add a new localized page, add its path there** so the language toggle can find it.

### Core dependency: `pls-lib`

Contract/multisig/crypto logic lives in the external `pls-lib` package (`github:PrivateLawSociety/pls-lib`). Aliases to its subpackages are defined in **`vite.config.ts`** (`resolve.alias`), not in `svelte.config.js`. This is deliberate: keeping them out of `kit.alias` prevents svelte-kit from generating tsconfig `paths`, which would otherwise make `svelte-check` follow third-party `.ts` sources we can't fix. Type checking goes through the ambient declarations in `src/pls-lib-ambient.d.ts` (which type these modules as `any`).

Aliases:

- `pls-bitcoin` — Bitcoin multisig (Taproot) helpers
- `pls-liquid` — Liquid multisig helpers
- `pls-core` — shared primitives (`hashFromJSON`, schemas)
- `pls-full` — combined types/schemas (`Contract`, `UnsignedContract`, `contractSchema`, `unsignedContractSchema`)
- `pls-nostr` — Nostr helpers

### App layers under `src/lib`

- `bitcoin.ts` — bitcoinjs-lib / ECPair wrappers, network selection, pubkey tweaking
- `nostr.ts` — `SimplePool` + hardcoded `relayList`, event signing/helpers; all Nostr traffic goes through this module
- `pls/contract.ts` — contract parse/sign/verify. Uses `unsignedContractSchema.strip()` via `getMinimalUnsignedContract` before hashing so extra fields can't alter the signed hash. Signatures are Schnorr over `hashFromJSON(minimalContract)`.
- `stores.ts` — Svelte stores. `peopleMetadata` lazily fetches Nostr kind-0 profiles and caches by pubkey; `contractDataFileStore` holds the in-progress contract file.
- `mempool.ts` — mempool.space API client
- `wot/` — Web of Trust logic (`index.ts`, `nostr.ts`, `rendering.ts`)
- `i18n/site.ts` — locale helpers for the EN/PT mirror
- `theme.ts` — light/dark theme store (initialized in root `+layout.svelte`)
- `components/` — shared UI (Flowbite-Svelte + Tailwind): `Button`, `Card`, `PersonChooser`, `SiteFooter`, `ThemeToggle`, etc.

### Routes (`src/routes`)

Marketing / shell:

- `/` — marketing home (EN), `/pt` — marketing home (PT)
- `/manifesto`, `/pt/manifesto`
- Root `+layout.svelte` renders the global header (logo, nav, language toggle, theme toggle, mobile drawer).

BJP app (client-only, under `/bjp` and `/pt/bjp`):

- `/bjp/start` — entry: `new` (generate key) or `import` (bring your own)
- `/bjp/keys` — key management view
- `/bjp/contract/{create,join,verify}` — contract lifecycle; `contract/shared.ts` holds shared helpers; `contract/create/{1..5}` are the multi-step wizard
- `/bjp/multisig/{start,continue,deposit}` — multisig collateral flow; `multisig/shared.ts` holds shared helpers
- `/bjp/settings`

WoT app (client-only, under `/wot` and `/pt/wot`):

- `/wot/login/{new,import}`, `/wot/keys`, `/wot/rate`, `/wot/table`, `/wot/graph`, `/wot/query`

When modifying a flow, check the sibling `shared.ts` — state and helpers are centralized there rather than duplicated across `+page.svelte` files. When adding a localized page, update the PT mirror and `localizedPaths` in `src/lib/i18n/site.ts`.

### Browser crypto / polyfills

`vite.config.ts` pulls in `vite-plugin-wasm`, `vite-plugin-top-level-await`, and `vite-plugin-node-polyfills` specifically so `bitcoinjs-lib`, `liquidjs-lib`, `@vulpemventures/secp256k1-zkp`, and `tiny-secp256k1` run in the browser. `@vulpemventures/secp256k1-zkp` is marked `external` in `rollupOptions`. If you add a new crypto dependency and hit a "Buffer is not defined" / WASM / top-level-await error, extend `optimizeDeps.include` here rather than working around it in app code.

## Stack & conventions

- **Svelte 5** + **SvelteKit 2** + **Vite 7**. Svelte 5 runes (`$state`, `$derived`, `$props`) are available, but most existing components still use Svelte 4-style reactivity (`$:`, `export let`). Match the surrounding file's style when editing; don't mass-migrate.
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` / `postcss.config.js` — config lives in CSS via `@theme`). Theming uses CSS custom properties like `rgb(var(--bg))`, `rgb(var(--surface-2))`, `rgb(var(--text))`, `rgb(var(--border))`, and Tailwind color `pls-blue-400`. Stick to these tokens for new UI instead of hardcoding hex.
- **Flowbite-Svelte 1.x** — API differs from 0.x; consult component source in `node_modules/flowbite-svelte` when in doubt.
- `tailwind-merge` for merging class lists.
- Prettier is the only formatter/linter (`.prettierrc`). Run `pnpm run format` before committing.
- Keep contract hashing routed through `getMinimalUnsignedContract` — never hash a raw object with extra fields.
- Node version is pinned via `.tool-versions`; Vercel runtime is `nodejs22.x`.

## Docs

- `README.md` (English) and `LEIAME.md` (Portuguese) — project overview
- Project wiki: https://github.com/PrivateLawSociety/pls-mvp/wiki
