# AGENTS.md – nurodymai agentams

SvelteKit (Svelte 5) frontas Baltijos Žvynas parduotuvei. BE: `moonia33/ecommercebackend`
(API aprašas `docs/frontend_svelte5_api_guide.md`), prekės ateina per `moonia33/bz_normalyzer`.
Kalba su vartotoju – lietuviškai. Nemerginti be vartotojo patvirtinimo.

## Aplinka

- Node 24 (`~/.nvm`), `npm install`.
- Importų alias: **`#lib/...`** (ne `$lib`).
- `npm run check` (svelte-check): main jau turi ~18 baseline klaidų – lygink skaičių, nesitikėk 0.
- `npm run build` – galutinė patikra.

## Kainos, sandėliai, badge'ai (BE skaičiuoja, FE tik rodo)

- Prekė gali būti keliuose sandėliuose (pvz. tiekėjas + „Centrinis sandėlis“ = Albatros).
  BE parenka pigiausią sandėlį su likučiu ir grąžina `price`, `compare_at_price`,
  `discount_percent`, `delivery_window`, `offer_id`, `offer_label`. FE nieko neperskaičiuoja.
- Marketingo badge'ai: `badges: BadgeOut[]` (`code`, `name`, `style`, `color`) sąraše ir PDP;
  rodo `src/lib/components/shop/ProductBadges.svelte` (`ProductCard.svelte`, `src/routes/p/[slug]/+page.svelte`).
  Badge'ai kuriami BE admine (`docs/badges.md` BE repo). Senas `labels.includes('new')` – tik fallback.
- Katalogo filtras pagal badge: `?collection=<badge kodas>`.
