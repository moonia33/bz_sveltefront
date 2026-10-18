# Frontend agent instructions: Preline design + SvelteKit (reactivity + SSR)

Project: e-commerce. Backend: Django (REST API). Frontend: SvelteKit + Tailwind CSS + Preline.

## 0. Before you start

1. Read `package.json` and check the **installed** versions of `svelte`, `@sveltejs/kit`, `tailwindcss`, `preline`. Follow the matching syntax:
   - Svelte 5: runes (`$state`, `$derived`, `$effect`, `$props`), `onclick={...}`, snippets (`{@render children()}`), `$app/state`.
   - Svelte 4: stores, `on:click`, slots, `$app/stores`.
   - Tailwind v4: CSS-first config (`@import "tailwindcss"`, `@source`). Tailwind v3: `tailwind.config.js` with `content` and plugins.
2. If an API or setting is uncertain, check the official docs for the installed version instead of guessing.
3. Never change the visual design language (see section 2) unless explicitly asked.

## 1. Core principle

**Preline is our design system, not our behavior layer.**

- Preline provides: markup patterns, Tailwind class combinations, spacing, typography, colors, states.
- Svelte provides: state, DOM updates, events, routing, forms, accessibility behavior, SSR.
- Preline's JavaScript (`data-hs-*` attributes, `HSStaticMethods`, `HSDropdown`, `HSOverlay`, etc.) mutates the DOM directly and conflicts with Svelte's reactivity and SvelteKit navigation. **Do not use it by default.** Reimplement behavior in Svelte and keep Preline's classes.

Decision order for any interactive element:

1. Pure CSS / native HTML (`<details>`, `<dialog>`, `:focus-within`, `peer`/`group` utilities).
2. Svelte state + Preline classes (default for dropdowns, accordions, tabs, collapses, mobile menu, drawers).
3. Headless Svelte library (e.g. Bits UI) styled with Preline classes, for complex accessible widgets (combobox, select, popover, dialog with focus trap).
4. Preline JS wrapped in a Svelte action, only if 1-3 are not reasonable (e.g. range slider with noUiSlider, datepicker, file upload). Ask before choosing this.

## 2. Preserving the Preline design

- **Copy classes from Preline examples; do not invent a new style.** Reuse their patterns for buttons, inputs, cards, badges, nav, tables, pagination, breadcrumbs, product cards, filters, cart, checkout.
- Keep the existing tokens: color palette (primary, gray/neutral scales), `rounded-*`, `py-*/px-*` paddings, `text-sm`/`text-base` sizes, `font-medium/semibold`, shadows, borders, and the focus/disabled patterns used in Preline examples (for example `focus:outline-hidden` or `focus:outline-none` depending on the Tailwind version, `disabled:opacity-50`, `disabled:pointer-events-none`).
- Keep the **dark mode** pattern (`dark:` variants) consistent with Preline examples. If a component has no dark variant, add one using the same palette logic as neighboring components.
- Do not mix in other UI libraries' styles (Flowbite, daisyUI, Skeleton). Headless libraries are allowed only because they have no styles.
- Put theme-level decisions (brand color, font, radius) in one place (Tailwind theme / CSS variables), not scattered in components.
- When unsure how something should look, find the closest Preline pattern and adapt it, instead of designing from scratch.

### Porting a Preline HTML example into Svelte

1. Copy the HTML into a `.svelte` component.
2. **Keep** all visual classes.
3. **Remove** Preline JS hooks: `data-hs-*` attributes, `hs-*` JS component classes (for example `hs-dropdown`, `hs-accordion`, `hs-collapse`, `hs-overlay`, `hs-tab`), and ids used only by Preline JS.
4. **Replace JS-added state classes.** Preline variants such as `hs-dropdown-open:*`, `hs-accordion-active:*`, `hs-overlay-open:*`, `hs-collapse-open:*` rely on classes that Preline JS toggles. Convert them to explicit Svelte state:
   ```svelte
   <!-- Preline: class="... hs-accordion-active:bg-gray-100" -->
   <div class="... {open ? 'bg-gray-100' : ''}">
   ```
   (or `class:bg-gray-100={open}` in Svelte 4/5).
5. Add accessibility attributes (`aria-expanded`, `aria-controls`, `aria-haspopup`, `role`, `aria-labelledby`) and keyboard behavior (Escape closes, Enter/Space toggles, arrow keys where relevant).
6. Replace static data with props/`{#each}`; replace placeholder images with real data and explicit `width`/`height`.
7. Split into reusable components. Suggested structure:
   ```
   src/lib/components/
     ui/          Button, Input, Select, Badge, Card, Modal, Dropdown, Accordion, Tabs, Pagination
     shop/        ProductCard, ProductGrid, FilterSidebar, CartDrawer, PriceTag, Rating
     layout/      Header, Footer, MobileMenu, Breadcrumbs
   ```

## 3. Svelte reactivity rules

- Keep state **local and minimal**. Use `$derived` for anything computable from other state; never use `$effect` to compute values that can be `$derived`.
- Use `$effect` only for real side effects, and remember it runs **only in the browser**.
- Shared state (cart, UI flags): put in a module (`.svelte.ts` with runes) or a store. **Never keep per-user state in module-level variables on the server** (shared between requests). Create it per request via context/`locals`, or keep it client-only.
- Do not mutate the DOM directly (`document.querySelector`, `classList.add`) inside components. If unavoidable, do it in an action (`use:`) or `onMount`, and clean up in the returned destroy function.
- Do not use `{@html}` with untrusted content. Search highlighting from the search engine must be sanitized or rendered via safe markup.
- Dropdowns/modals: close on outside click (action), on Escape, and on navigation. Manage focus (return focus to the trigger on close; trap focus in modals).

Example: reusable accordion item with Preline look and Svelte state (Svelte 5):

```svelte
<script lang="ts">
  // id is passed in by the parent (stable on server and client)
  let { id, title, open = $bindable(false), children } = $props();
</script>

<div class="border-b border-gray-200 dark:border-neutral-700">
  <button
    type="button"
    class="py-3 inline-flex items-center justify-between gap-x-3 w-full font-semibold text-start text-gray-800 hover:text-gray-500 focus:outline-hidden dark:text-neutral-200"
    aria-expanded={open}
    aria-controls="{id}-panel"
    onclick={() => (open = !open)}
  >
    {title}
  </button>
  <div id="{id}-panel" class="pb-3 text-gray-600 dark:text-neutral-400" hidden={!open}>
    {@render children?.()}
  </div>
</div>
```

> SSR note: never generate ids with `Math.random()`/`crypto.randomUUID()` during render (hydration mismatch). Pass a stable id/prop, use the item index, or Svelte's built-in id helper if the installed version provides one.

## 4. SSR and hydration rules (SvelteKit)

- **No browser globals at module top level or during render**: `window`, `document`, `localStorage`, `navigator`, `matchMedia`. Use `onMount`, `$effect`, or guard with `import { browser } from '$app/environment'`.
- **Server and first client render must produce identical HTML.** Avoid `Math.random()`, `Date.now()`, locale/timezone-dependent formatting, or screen-size logic in the initial render. Compute those after mount.
- **Default state must be SSR-safe**: menus, modals, drawers closed; accordions in their intended default state; no content that is only visible after JS runs.
- **Progressive enhancement**: main pages (home, category, search results, product, cart, checkout) must render meaningful content and work for navigation with JavaScript disabled. Forms should use SvelteKit form actions with `use:enhance`.
- **Data loading**: fetch from Django in `+page.server.ts` / `+layout.server.ts` (or `+page.ts` when appropriate) using the provided `fetch`, so SSR works and cookies/headers are forwarded correctly. Never expose secret keys to the client. Handle errors with `error()`/`redirect()` from `@sveltejs/kit`.
- **URL is the source of truth for listing state** (search query, filters, sort, page): read from `url.searchParams` in `load`, update with `goto(url, { keepFocus: true, noScroll: true, replaceState: true })` (use `replaceState` for typing-driven updates, normal navigation for deliberate filter changes). This gives shareable URLs, SEO, and correct SSR.
- Debounce search-as-you-type input (about 200 ms) and cancel stale requests with `AbortController`.
- **SEO**: set `<svelte:head>` title/description/canonical per page, use semantic headings, structured data (JSON-LD) for products, and `loading="lazy"` plus width/height on images to avoid layout shift.
- **Dark mode without flash**: decide theme on the server from a cookie and write the `dark` class on `<html>` during SSR.
  ```html
  <!-- src/app.html -->
  <html lang="lt" class="%theme%">
  ```
  ```ts
  // src/hooks.server.ts
  import type { Handle } from '@sveltejs/kit';
  export const handle: Handle = async ({ event, resolve }) => {
    const theme = event.cookies.get('theme') === 'dark' ? 'dark' : '';
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%theme%', theme)
    });
  };
  ```
  Toggle the class and cookie from a Svelte component; do not use Preline's theme-switch script. If there is no stored preference and system preference should apply, handle it with a small inline script in `app.html` that runs before paint.

## 5. Tailwind and Preline setup checklist

- Tailwind must see Preline's classes: ensure the Preline JS/CSS sources are included only if Preline JS is actually used. For the installed Tailwind version, follow the official Preline setup (Tailwind v4: `@source` and `@import "preline/variants.css"` as documented; Tailwind v3: `content` entry and `preline/plugin`). Verify against the docs for the installed Preline version.
- Tailwind `content`/`@source` must include `src/**/*.{html,js,svelte,ts}`.
- If a Preline example uses a Preline-specific variant (`hs-*:`), do not leave it in unless the corresponding Preline JS is deliberately loaded.
- Run the dev build and confirm styles are not purged in production (`npm run build && npm run preview`).

## 6. If Preline JS is truly required (last resort)

Only after approval. Rules:

- Load it **client-side only**, lazily:
  ```ts
  // $lib/actions/preline.ts
  import type { Action } from 'svelte/action';
  import { browser } from '$app/environment';

  export const preline: Action<HTMLElement> = (node) => {
    if (!browser) return;
    let cancelled = false;
    (async () => {
      await import('preline/dist/index.js');
      if (cancelled) return;
      window.HSStaticMethods?.autoInit(); // prefer initializing only the needed component if the API allows
    })();
    return { destroy() { cancelled = true; /* destroy component instances if the API provides it */ } };
  };
  ```
- Add a global type declaration (`src/app.d.ts`) for `window.HSStaticMethods` instead of using `any`.
- Re-initialize after client navigation (`afterNavigate`) and after dynamic content changes, and keep Preline-controlled elements **out of** `{#if}`/`{#each}` blocks that re-render frequently. Wrap them in a stable parent element.
- Never let Preline JS and Svelte control the same element's classes or visibility.
- Isolate each use in its own component so it can be replaced later.

## 7. Accessibility and quality bar

- Interactive elements are real `<button>`/`<a>`, with visible focus styles (Preline focus ring patterns), labels for inputs, and `aria-*` where needed.
- Respect `prefers-reduced-motion` for transitions.
- Color contrast must stay acceptable in both light and dark themes.
- Mobile first: check every new component at small, medium, and large breakpoints; wide content scrolls inside its own container, not the page.
- Prices, currency, and numbers are formatted with `Intl` on both server and client using the same locale/options (avoid hydration mismatches).

## 8. Definition of done (verify before reporting completion)

- [ ] `npm run check` (svelte-check / TypeScript) and lint pass.
- [ ] `npm run build` succeeds; production preview shows correct styling.
- [ ] No hydration warnings or console errors on the changed pages.
- [ ] Main content visible and navigable with JavaScript disabled (where applicable).
- [ ] Visual result matches the Preline reference in light and dark mode and at mobile/desktop widths.
- [ ] No Preline JS (`data-hs-*`, `HSStaticMethods`) introduced without explicit approval.
- [ ] No browser globals accessed during SSR; no shared per-user state on the server.
- [ ] Keyboard: all new interactive components usable with keyboard only (Tab, Enter/Space, Escape).

## 9. Working style

- Prefer small, reviewable changes. Explain which Preline example a component was derived from and what was changed.
- Do not add dependencies without asking. If a headless library is needed, propose one and state why.
- If the instructions conflict with the installed library versions, say so and propose the smallest compatible adjustment.
