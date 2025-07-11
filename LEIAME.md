# Bitcoin Justice Protocol - Private Law Society

[**[🇺🇸] English version: README.md**](README.md)

## Resumo

O Bitcoin Justice Protocol (BJP) é um componente essencial da Private Law Society (PLS), desenvolvido para facilitar a criação de contratos descentralizados com termos exequíveis. Através do BJP, ambas as partes concordam com um árbitro (ou múltiplos árbitros) e utilizam Bitcoin como colateral para garantir o cumprimento do contrato. As partes enviam o colateral necessário para o contrato, que pode ser resgatado posteriormente se:

1. Ambas as partes concordarem
2. Uma das partes + os árbitros concordarem

Isso significa que os árbitros não podem fugir sozinhos com o dinheiro, mas ainda podem punir financeiramente a parte que perdeu a disputa.

## Links Úteis

[Entre no servidor do Discord por aqui](https://www.privatelawsociety.net/join)

[Youtube do PLS](https://www.youtube.com/@privatelawsociety)

[Página da PLS no X](https://x.com/PrivateLawSoc)

[Página da PLS no Nostr](https://njump.me/npub1p79dx59d5gctllar73cqnucqft89gpkfmydxj4mmk2jj69s7hn3sfjatxx)

[Site hospedado do MVP da WoT](https://pls-bjp.vercel.app/)

[Episódio de podcast sobre a PLS](https://www.youtube.com/watch?v=NGx7h9kpPE8)

[🇺🇸] [Mais documentação pode ser encontrada aqui](https://private-law-society.gitbook.io/docs/)

## Desenvolvimento

Depois de baixar o projeto e instalar as dependências com `pnpm install`, inicie um servidor de desenvolvimento:

```bash
# `-- --open` abre o site em uma nova aba do navegador
pnpm run dev -- --open
```

## Executando localmente

Para criar uma versão de produção:

```bash
pnpm run build
```

Você pode ver a compilação de produção com `pnpm run preview`.
