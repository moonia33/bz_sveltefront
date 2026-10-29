# Daugiakalbių domenų rollout planas (lt, pl, en, de, lv, et)

**Architektūrinis sprendimas (implementuota 2025-10-29):** vienas git repo +
vienas kodas → atskiri deploy instance'ai per kalbą. **Vienas instance =
viena kalba (`SITE_LOCALE` runtime env)** — domenai nefiksuoti code'e.

```
Coolify app #1: <lt domenas>   → SITE_LOCALE=lt
Coolify app #2: <pl domenas>   → SITE_LOCALE=pl
Coolify app #3: <en domenas>   → SITE_LOCALE=en
                ↑ tas pats repo, tas pats branch, runtime env skiria
Backend:        vienas Django — kalba per Accept-Language (proxy set'ina)
```

Kodėl NE compile-time domenai: domenai dar nebaigtiniai/keičiami —
locale resolution yra `src/lib/i18n/instance.ts` → `SITE_LOCALE` env
(`src/env.ts` deklaracija, `static:false` → runtime, ne inlined).

### Kas jau implementuota (frontend pamatas)

- `@inlang/paraglide-js` + `project.inlang` — locales: `lt` (base), `pl`,
  `en`, `de`, `lv`, `et`; messages `messages/{locale}.json`
- `vite.config.ts` — plugin + `urlPatterns` iš `ROUTE_ALIASES` lentelės
- `src/lib/i18n/instance.ts` — `overwriteGetLocale` → `SITE_LOCALE` env
- `src/hooks.ts` — `reroute` → `deLocalizeUrl` (localized path → canonical)
- `src/hooks.server.ts` — `paraglideMiddleware` + `%lang%`/`%dir%`/`%theme%`
- `src/hooks.client.ts` — instance locale registracija
- `app.html` — `lang="%lang%" dir="%dir%"`
- `/api/v1` proxy — `Accept-Language: {locale}` header'is upstream'ui
- `package.json` `imports` — `#lib/paraglide/*` → `*.js` mapping
- Patikrinta end-to-end: `SITE_LOCALE=pl` → `<html lang="pl">`, PL tekstai
  SSR, `/cart`→200, `/account`→303

### Route lokalizacija — EN-stiliaus path'ai ne-LT kalboms

Canonical vidiniai route'ai lieka LT (`src/routes/` nekeičiami).
`ROUTE_ALIASES` (`vite.config.ts`) map'ina ne-LT lokalizacijas:

| Canonical | Ne-LT path |
|---|---|
| `/krepselis` | `/cart` |
| `/paskyra` | `/account` |
| `/uzsakymas` | `/order` |
| `/prisijungti` | `/login` |
| `/megstamos` | `/favorites` |
| `/katalogas` `/kategorijos` `/kolekcijos` | `/catalog` `/categories` `/collections` |
| `/akcijos` `/ispardavimas` `/naujienos` | `/deals` `/outlet` `/news` |
| `/gamintojai` `/parduotuves` | `/brands` `/stores` |
| `/pagalba` `/grazinimas` | `/help` `/returns` |

`/k` `/g` `/p` `/info` `/checkout` — simboliniai, nepakitę visoms kalboms.
Konkrečios kalbos vėliau gali gauti savus path'us (pvz. PL `/koszyk`) —
pakanka redaguoti `ROUTE_ALIASES` į per-locale map'ą.

**Dėmesio:** visi vidiniai link'ai `.svelte` failuose (`href="/krepselis"`)
turi eiti per `localizeHref()` — kitaip ne-LT instance'uose link'ai ves į
LT path'us (veikia, bet URL'ai nelokalizuoti).

### Kalbos switcher'is — backend API (domenai admin-valdomi)

Frontend'as neturi žinoti domenų compile-time. Backend endpoint'as
(grąžina aktyvias kalbas + jų domenus — iš Shop/ShopDomain config'o):
`GET /api/v1/site/locales` → `[{code, name, domain, is_default}]`.
Switcher link'as: `https://{domain}{localizeHref(currentPath,{locale})}`.

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

### Sprendimas dėl route'ų (implementuota)

Canonical vidiniai route'ai — LT; ne-LT instance'ai serve'ina EN-stiliaus
path'us per `urlPatterns` + `reroute` (žr. lentelę aukščiau). Visiškai
lokalizuoti per-kalbos path'ai (PL `/koszyk`, DE `/warenkorb`) — galima
vėliau išplėsti `ROUTE_ALIASES` į per-locale struktūrą; slug'ai ir taip
lokalizuoti per `*Translation.slug`.

---

## Phase A — Frontend i18n pamatai

### A1–A2 ✅ paraglide setup + locale resolution — ĮGYVENDINTA

- `@inlang/paraglide-js@2.29.1` + `project.inlang` (6 locales)
- `src/lib/i18n/instance.ts` — `overwriteGetLocale` → `SITE_LOCALE`
- `src/env.ts` — `SITE_LOCALE` (`public`, runtime)
- hooks/server/client + `app.html` `%lang%`/`%dir%`
- `messages/{lt,pl,en,de,lv,et}.json` — seed raktai, pipeline patikrintas

**Konvencija raktams:** `page_section_purpose`, pvz.
`pdp_add_to_cart`, `checkout_continue`, `nav_catalog`, `toast_added_to_cart`.

### A3. Tekstų iškėlimas (52 failai) — mechaninis, didžiausia dalis darbo

Kartu su tekstais — **vidiniai link'ai**: `href="/krepselis"` →
`href={localizeHref('/krepselis')}` (importuojama iš
`#lib/paraglide/runtime`). Canonical path per `localizeHref` išeis į
lokalizuotą (`/cart` PL/de/lv/et/en instancuose).

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

### A4. Kalbos perdavimas backend'ui ✅ ĮGYVENDINTA

`/api/v1` proxy set'ina `Accept-Language: {instanceLocale()}` visoms
upstream užklausoms — ir server-side `event.fetch`, ir client-side
browser fetch'ai eina per tą patį proxy → viena vieta dengia viską.
Instance locale laimi prieš browser header'į (domenas yra autoritetas).

### A5. Kalbos selector'ius — backend-driven

- Backend `GET /api/v1/site/locales` → `[{code, name, domain, is_default}]`
  iš Shop/ShopDomain config (admin-editable)
- Header'e + mobile meniu: switcher → `https://{domain}{localizeHref(path,{locale})}`
- `site_pref` cookie — geo-redirect'ui (E fazė)

---

## Phase B — Backend kalba/domenai

### B1. Locales/domains API (naujas sprendimas — domenai admin-valdomi)

Frontend kalba NĖRA pririšta prie domeno backend'e — ji ateina iš
`Accept-Language` (proxy). Kas lieka backend'e:

- **`GET /api/v1/site/locales`** — grąžina aktyvias kalbas + domenus
  switcher'iui. Šaltinis: `ShopDomain` modelis (domain, language_code,
  is_active, sort_order) arba `Shop.locales` JSON — admin-editable, domenų
  keitimui nereikia deploy'o.
- `Shop` `additional_domains` — `.pl` ir kiti domenai priregistruojami
  tam pačiam Shop'ui (katalogas/policies bendri). `default_language_code`
  lieka tik *paskutinis* fallback'as — realiai Accept-Language laimi.
- `get_request_language_code` grandinė (jau yra): path prefix → `?lang=` →
  Accept-Language → shop.default → `'lt'` — papildymų nereikia, gal tik
  domain→language šaka prieš shop.default jei norėsim.

### B2. Accept-Language propagation ✅ ĮGYVENDINTA (frontend proxy)

Proxy set'ina `Accept-Language: {SITE_LOCALE}` — užtenka.

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

## Phase C — Turinio vertimai

**Šaltinių realija:** didžioji dalis prekių normalyzer'yje turi **EN
šaltinį**; dalis tiekėjų duoda ir **PL, DE** translations iškart.
Strategija:

- **EN** — pirminis vertimo šaltinis kur jis yra (EN→PL/DE/LV/ET MT kokybė
  geresnė nei LT→X; EN→LT irgi naudinga LT turinio tobulinimui)
- **PL/DE** — seed'inti iš tiekėjų duomenų kur yra (nemokamas profesionalus
  šaltinis), likusį — MT
- **LV/ET** — beveik visada MT iš EN/LT
- **LT** — bazinė kalba; kur EN šaltinis geresnis — galima papildyti LT
  translations iš EN

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
