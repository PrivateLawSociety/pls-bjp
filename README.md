# Bitcoin Justice Protocol - Private Law Society

[**[🇧🇷] Versão em português: LEIAME.md**](LEIAME.md)

## TL;DR

Bitcoin Justice Protocol (BJP) is a core component of the Private Law Society (PLS), designed to facilitate the creation of decentralized contracts with enforceable terms. Through BJP, both parties agree on an arbitrator (or multiple arbitrators) and use Bitcoin as collateral to ensure the contract's fulfillment. The parties send the necessary collateral to the contract, where it can be later redeemed if either:

1. Both parties agree
2. One of the parties + the arbitrators agree

This mechanism prevents arbitrators from running off with the funds, while still allowing them to financially penalize the party that fails to comply. By leveraging Bitcoin, the BJP provides a secure, trustless, and decentralized enforcement system, ensuring fairness and accountability in private contract disputes.

## Useful links

[Join the Discord server here](https://discord.gg/PNE3PZTUNz)

[PLS Youtube channel](https://www.youtube.com/@privatelawsociety)

[PLS X page](https://x.com/PrivateLawSoc)

[PLS Nostr page](https://njump.me/npub1p79dx59d5gctllar73cqnucqft89gpkfmydxj4mmk2jj69s7hn3sfjatxx)

[Hosted website for the MVP](https://pls-bjp.vercel.app/)

[🇧🇷] [Podcast episode about PLS](https://www.youtube.com/watch?v=NGx7h9kpPE8)

[More documentation can be found here](https://github.com/PrivateLawSociety/pls-mvp/wiki)

## Developing

Once you've downloaded the project and installed dependencies with `pnpm install`, start a development server:

```bash
# `-- --open` opens the website in a new browser tab
pnpm run dev -- --open
```

## Running Locally

To create a production version:

```bash
pnpm run build
```

You can preview the production build with `pnpm run preview`.
