# Daugiakalbių domenų rollout planas (PL → vėliau LV/EE/EN)

**Architektūrinis sprendimas (patvirtinta):** vienas git repo + vienas kodas →
atskirai deploy'inami instance'ai per kalbą/domeną. Tas pats backend'as visiems.

```
Coolify app #1: baltijoszvynas.lt     → SITE_LOCALE=lt
Coolify app #2: baltijoszvynas.pl     → SITE_LOCALE=pl
                ↑ tas pats repo, tas pats branch
Backend:        vienas Django — kalba per host/shop context
```

Kodėl NE atskiras repo: per mėnesį instance'ai diverguotų, kiekvienas fix —
dvigubas darbas. Kodėl atskiri instance'ai (ne vienas instance abiems
domenams): deploy izoliacija, galima laikinai prisegti versijas migracijos
metu, paprastesnis cache/CDN skyriumas.

---

## Esamoji būsena (inventorizacija 2025-10-28)

### Backend — beveik paruoštas ✅

| Komponentas | Būsena |
|---|---|
| `*Translation` modeliai | ✅ Product, Category, Brand, Feature, FeatureValue, OptionType, OptionValue, ContentBlock |
| `get_request_language_code()` (`api/i18n.py`) | ✅ path prefix → `?lang=` → `Accept-Language` → `shop.default_language_code` → fallback |
| `Shop.default_language_code` | ✅ jau modelyje — per-domain locale |
| `SUPPORTED_LANGUAGE_CODES` env | ✅ default `["lt","pl","en"]` |
| Shop context per host | ✅ `forwardHost` proxy → `get_request_shop` — domenas→shop jau veikia |
| Transakciniai laiškai (OTP, order confirm) | ❓ tikrinti — tikėtina LT-only šablonai |
| Vertimų turinys (PL eilutės DB) | ❌ tuščias — reikia užpildyti |

### Frontend — i18n infra nėra ❌

- **52 `.svelte` failai** su LT diakritikais — tekstai hardcoded kode
- Nėra paraglide/i18n bibliotekos
- `hooks.server.ts` — tik theme + robots tag (locale resolution įdėti čia)
- `app.html` — `%theme%` transform pattern jau yra → `%lang%` pridėti analogiškai
- Route'ai: simboliniai `/k` `/g` `/p` `/info` `/checkout` + LT žodiniai
  (`/krepselis` `/paskyra` `/prisijungti` `/katalogas` `/kategorijos`
  `/gamintojai` `/kolekcijos` `/akcijos` `/ispardavimas` `/naujienos`
  `/megstamos` `/grazinimas` `/pagalba` `/parduotuves` `/uzsakymas`)

### Sprendimas dėl route'ų (rekomendacija)

**v1 — palikti tuos pačius path'us visuose domenuse.** `/k`, `/g`, `/p` —
simboliniai. LT žodiniai route'ai (`/krepselis` ir t.t.) liks kaip techniniai
path'ai — veikia, bet PL domene atrodo svetimkalbiškai. SEO kritiška dalis —
*slug'ai*, o jie lokalizuoti per `*Translation.slug`.

**v2 (opcionalu, vėliau)** — SvelteKit `reroute` hook'as: PL domeno
`/koszyk` → vidinis `/krepselis`. Fiksuota ~15 route'ų lentelė + `route()`
helper'is link'ams. Atskiri task'ai, neužblokuoja rollout'o.

---

## Phase A — Frontend i18n pamatai (didžiausias mechaniškas darbas)

### A1. paraglide-js setup

```bash
npx @inlang/paraglide-js init   # arba rankinis setup
```

- `project.inlang/` + `messages/lt.json` (source of truth) + `messages/pl.json`
- `vite.config.ts` — paraglide plugin
- `package.json` — postbuild machine-translate hook opcionalu
- Struktūra: `messages/{locale}.json` → `m.message_key()` iškvietimai kode

**Konvencija raktams:** `page_section_purpose`, pvz.
`pdp_add_to_cart`, `checkout_continue`, `nav_catalog`, `toast_added_to_cart`.

### A2. Locale resolution (`hooks.server.ts`)

```ts
const locale = process.env.SITE_LOCALE           // 1) env (per-instance)
  ?? hostToLocale(event.url.hostname)            // 2) host fallback
  ?? 'lt';
```

- `hostToLocale`: `baltijoszvynas.pl`→`pl`, `.lt`→`lt`, `.lv`→`lv`...
- `event.locals.locale` + `setLocale()`/`getLocale()` paraglide pattern
- `transformPageChunk`: `%lang%` → locale (app.html `<html lang="%lang%">`)

### A3. Tekstų iškėlimas (52 failai)

Darbo eilutė — **ne viskas iškart**, sekcijomis:

1. `src/lib/components/layout/` (Header, Footer, SearchModal, nav)
2. `src/lib/components/shop/` (CatalogPage, ProductCard, FilterSidebar…)
3. `src/routes/` pagal svarbą: `p/[slug]` → `checkout` → `krepselis` →
   `paskyra` → katalogų route'ai → statiniai (`pagalba`, `info`…)

Taisyklės:
- LT tekstas su diakritikais = kandidatas (`grep "ą\|č\|ę\|ė\|į\|š\|ų\|ū\|ž"`)
- Dinaminės eilutės → `{param}` interpoliacija (`m.cart_items({count})`)
- Pluralizacija — paraglide palaiko; LT/PL turi skirtingas formas
- Atributai: `placeholder`, `aria-label`, `title`, `alt` — irgi iškelti
- Toast'ai, error'ai, validacijos — nepamiršti
- `svelte-check` po kiekvienos sekcijos

**Kontrolinis sąrašas prieš merge:** `svelte-check` 0 err, `npm run build` OK,
`messages/pl.json` be trūkstamų raktų (paraglide meta build error'ą).

### A4. Kalbos perdavimas backend'ui

`src/lib/api/client.ts` + proxy `src/routes/api/v1/[...path]/+server.ts`:
- `Accept-Language: {locale}` header'į įstatyti visoms upstream užklausoms
  (backend'as jau turi `get_request_language_code` → `Accept-Language` šaka)
- Form actions (`use:enhance` → server `mutate`) — tas pats header'is

Rezultatas: `product.name`, `category.name`, `option_value.label` ateina PL.

### A5. Kalbos selector'ius

- Header'e: `LT | PL` switcher'as → `href` į kitą domeną (TAS PATS path +
  query), `site_pref` cookie
- Mobile meniu irgi

---

## Phase B — Backend per-domeno kalba

### B1. Domain ↔ locale binding (patikrinta: `api/models.py`)

`Shop` turi `primary_domain` + `additional_domains` (comma-separated) —
**vienas Shop aptarnauja kelis domenus**. Bet `default_language_code` yra
per-shop → reikalinga per-domain kalba, Naujas Shop įrašas `.pl` domenui
BLOGAS sprendimas (dubliuotų policies, `shop_ids` scop'ą, katalogą).

**Sprendimas:** domain→language map'as. Variantai:
- `ShopDomain` modelis (domain, language_code, is_primary) — admin-editable,
  rekomenduoju
- arba `Shop.domain_languages` JSONField `{"baltijoszvynas.pl": "pl"}`
- arba `additional_domains` sintaksė `"domain:lang"` — pigu, bet hacky

`get_request_language_code` fallback grandinė tampa:
path prefix → `?lang=` → Accept-Language → **domain language** →
shop.default → `'lt'`.

### B2. Accept-Language propagation

- Proxy jau forward'ina header'ius — užtikrinti kad `Accept-Language`
  NEdingsta (frontend jį SET'ina, ne tik forward'ina browserio — browserio
  PL vartotojas gali turėti `lt` Accept-Language, bet domenas turi laimėti)
- Server-side `event.fetch` — tas pats

### B3. Transakciniai laiškai

- OTP laiškas, order confirmation, order status — per `user.locale` arba
  `order.locale`/`shop.default_language_code`
- Įrašyti `Order.locale` (arba `site_domain`) užsakymo metu — žinosime
  iš kur atėjo + kuriuo kalbu siųsti laiškus
- Email šablonai → LT/PL variantai (markdown/partial'ai per locale)

### B4. Fallback politika

`get_request_language_code` jau turi fallback'ą į shop default → default.
Patikrinti serializatoriuose: jei `pl` translation tuščias → grąžina `lt`
(turinys geriau LT nei tuščias string'as). Jei ne — pridėti.

---

## Phase C — Turinio vertimai (PL)

### C1. Kategorijos / Brand'ai / Navigacija

- Nedidelis kiekis — profesionalus arba AI + review
- Admin'e `*Translation` inline'ai jau yra → užpildyti `pl` (name, slug,
  description, seo fields)

### C2. Features / Options / OptionValues

- `FeatureTranslation`, `OptionTypeTranslation`, `OptionValueTranslation` —
  terminija (meškerių žargonas PL ≠ LT≠ EN) — AI draft + domain review

### C3. Prekės (ProductTranslation)

- ~visas katalogas — AI machine translation per normalizer pipeline:
  - `name`, `description`, `slug` (slug → per slugify, unikalus)
  - Normalizer'e pridėti `translate` step'ą arba atskirą management command'ą
- Chunk'uota, su review status'u (`needs_review` flag'as jei nėra — admin
  filtras „neišversta"/`translation missing`)

### C4. ContentBlocks / statiniai puslapiai

- `ContentBlockTranslation` — pagalba, apie, pristatymo info, taisyklės
- Legal tekstai — tikrinimas (PL teisės aktų nuorodos!)

### C5. Slug'ų strategija

- `Translation.slug` užpildyti PL slug'ais (geras SEO)
- Jei translation.slug tuščias → fallback lt slug (backend jau turi?)
- `/p/<lt-slug>` PL domene → 301 į `/p/<pl-slug>` (canonical teisingas)

---

## Phase D — SEO

### D1. hreflang

`+layout.server.ts`/`+page.server.ts` generuoja:

```html
<link rel="alternate" hreflang="lt" href="https://baltijoszvynas.lt/p/xxx" />
<link rel="alternate" hreflang="pl" href="https://baltijoszvynas.pl/p/yyy" />
<link rel="alternate" hreflang="x-default" href="https://baltijoszvynas.lt/p/xxx" />
```

- YYY = *translated* slug (ne tas pats path su kitokiu domenų!)
- Reikia endpoint'ų kurie grąžina alternates: arba backend duoda
  `alternate_slugs` response'e, arba FE deduoja per `?lang=` fetch'ą
  (paprasčiau — backend pateikia translations objektą)

### D2. canonical / OG

- `canonical` — self per domain (NE cross-domain)
- `og:locale` → `lt_LT` / `pl_PL`
- `og:locale:alternate` — kiti
- Meta title/description per locale (SEO fields translations jau yra?)

### D3. Sitemap / robots

- `sitemap.xml` per domeną su `xhtml:link` hreflang alternates
- `robots.txt` — per domain, sitemap link'as

### D4. `<html lang>`

- `app.html` `%lang%` → iš A2

---

## Phase E — Deployment + geo redirect

### E1. Coolify instance #2

- Tas pats repo/branch, `SITE_LOCALE=pl`, `PUBLIC_SITE_DOMAIN=baltijoszvynas.pl`
- SSL (Let's Encrypt), healthchecks
- `API_BASE_URL` — tas pats backend
- Backend `ALLOWED_HOSTS` / shop-domain map — `.pl` domeną užregistruoti

### E2. Cloudflare

- `.pl` DNS → Coolify instance #2
- Cache rules — tas pats pattern'as
- **Geo redirect rule (Snippet/Redirect rule):**

```
Jei host = baltijoszvynas.lt
   IR cf.country ∈ {PL} (arba vėliau LV/EE map'ai)
   IR nėra site_pref cookie
   IR user-agent NĖRA bot'as (googlebot|bingbot|…)
→ 302 https://baltijoszvynas.pl{path}
+ Set-Cookie: site_pref=pl; Max-Age=31536000
```

- `x-default` ir neužmap'inti country → lieka
- **Svarbu:** 302 (ne 301 — gali reikėti keisti), bots skip, tik pirmą kartą

### E3. site_pref garbavimas

- Jei `site_pref=lt` bet atėjęs į `.pl` → banner'io alternatyva arba
  tyliai gerbiame (decision: tyliai — switcher'as header'e)
- Language switcher visada matomas → vartotojas gali grįžti

---

## Darbų seka (rekomenduojama)

| # | Fazė | Priklausomybės | Rizika |
|---|---|---|---|
| 1 | A1–A2 paraglide + hooks | — | maža |
| 2 | A3 iškėlimas (sekcijomis, ~5 PR'ų) | A1 | mechaninis, didelis |
| 3 | B1–B2 shop locale + Accept-Language | — | maža (backend jau turi) |
| 4 | A4 + A5 locale propagation + switcher | A1, B2 | maža |
| 5 | C1+C2 nav/kategorijos/options PL | — | turinio kokybė |
| 6 | E1+E2 deploy .pl + geo (staging .pl) | 1–5 bent dalinai | SEO testai |
| 7 | C3 prekės AI vertimas | C2 | didelis kiekis, review flow |
| 8 | D1–D4 SEO | E1 | hreflang correctness |
| 9 | B3 laiškai | B1 | vidutinė |
| 10 | E3 + launch | viskas | smoke testai abiem domenams |

v2 (opcionalu, po launch): route localization per `reroute`.

---

## Testavimo matrica (smoke prieš launch)

- [ ] `baltijoszvynas.pl` → viskas PL, `<html lang="pl">`, PL slug'ai
- [ ] Prekė be PL translation → LT fallback (ne tuščias laukas)
- [ ] `/krepselis` → `/checkout` → order → `order.locale=pl`, laiškas PL
- [ ] Search (Typesense) — PL užklausos, PL rezultatai (kalba index'e?)
- [ ] hreflang alternates — Google Search Console validation
- [ ] Geo redirect: PL IP → .lt → 302 .pl + cookie; antras vizitas → neredirect
- [ ] Googlebot UA → niekada neredirectinamas
- [ ] LT site nieko nesugadinta (regresija)

## Atviri klausimai

1. **Shop modelis:** `.pl` = atskiras Shop įrašas ar tas pats su dviem
   domenais? (priklauso nuo esamo domain→shop resolution — patikrinti B1 metu)
2. **PL vertimo kokybė:** AI draft + review ar profesionalus vertėjas?
   (rekomenduoju AI draft → admin review flow, terminijos žodynėlis)
3. **Typesense (patikrinta: `search/services.py` SCHEMA):** viena kolekcija,
   `search_text` pre-normalizuotas (diacritic folding). **Sprendimas:**
   multi-lang laukai toje pačioje kolekcijoje — `name_pl`, `name_sort_pl`,
   `search_text_pl` (+ per kalbą vėliau). `query_by` parenkamas pagal
   request locale backend'e. Reikia schema update + reindex command'as
   per kalbą. Fallback: jei `*_pl` tušti → LT laukai.
4. **`.pl` domenas** jau nupirktas?
5. **Kalbų seka:** PL pirmas? Tada LV/EE/EN tame pačiame mechanizme.
