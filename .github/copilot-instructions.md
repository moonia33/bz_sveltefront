# Copilot instructions — SvelteKit + Preline

## Project context
- This project is a SvelteKit application.
- The UI stack is built around Tailwind CSS and Preline.
- Prefer component-first, readable, minimal implementations over heavy abstractions.
- Keep business logic separated from presentation, and keep Svelte components focused and small.

## SvelteKit best practices
- Use SvelteKit conventions for routing and data access: `+page.svelte`, `+layout.svelte`, `+page.ts`, `+layout.ts`, and `+server.ts` when applicable.
- Prefer server-side data loading or route load functions for data that should be fetched before render.
- Keep logic in `lib/` or domain-specific modules instead of embedding everything in UI components.
- Use semantic HTML and accessible attributes (`label`, `aria-*`, button semantics, form controls, focus states).
- Prefer progressive enhancement and avoid unnecessary client-only logic.
- Keep SSR/CSR boundaries clear and avoid hydration issues.

## Tailwind + Preline best practices
- Treat Preline as the design system layer and Tailwind utility classes as the layout/spacing layer.
- Prefer Preline’s semantic component patterns and consistent utility classes over one-off custom styling when a matching component exists.
- Keep styling theme-aware and consistent with the chosen design tokens.
- Avoid hardcoded colors when the project already has visual tokens or theme variables.
- When integrating a Preline component or block, preserve the structure and data attributes required by Preline JS.
- Do not duplicate or reinitialize the same Preline plugin scripts multiple times across the same page.
- If a component needs JS behavior, initialize it once at the correct lifecycle point and keep it idempotent.

## Styling and theme guidance
- Prefer design tokens and shared theme variables over raw CSS values.
- Keep surfaces, borders, and states visually consistent across components.
- Use the same token semantics for similar UI surfaces (navigation, cards, page shell, sidebar, content layers).
- If a custom theme is introduced, ensure it remains scoped and consistent across light/dark variants.
- Avoid editing generated compiled CSS directly; prefer source-level theme definitions and project CSS entry points.

## Code quality rules
- Write clean, maintainable Svelte code.
- Prefer small, reusable components over large monolithic files.
- Favor explicit names and stable props over overly generic abstractions.
- Remove unused imports and dead code before finishing.
- Keep logic predictable and avoid unnecessary state churn.
- Validate that the final result matches the requested behavior and stays accessible.

## Agent workflow expectations
- When asked to integrate Preline UI, follow the repo’s Preline skill instructions and component/block selection guidance.
- For broader UI tasks, break complex layouts into smaller components and integrate them one step at a time.
- Prefer matching the existing application structure and not introducing unrelated patterns.
- If a feature is ambiguous, ask a focused clarifying question instead of guessing.

## Delivery checklist before finishing
- The component or page works in SvelteKit without obvious hydration or SSR issues.
- The markup is accessible and semantic.
- Preline classes and init hooks are consistent and not duplicated.
- The code follows the existing project conventions.
- The implementation is minimal, maintainable, and aligned with the requested design.
