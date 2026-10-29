import { SITE_LOCALE } from '$app/env/public';
import { overwriteGetLocale } from '#lib/paraglide/runtime';

export const SUPPORTED_LOCALES = ['lt', 'pl', 'en', 'de', 'lv', 'et'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'lt';

// Vienas deploy instance = viena kalba/domenas. SITE_LOCALE yra runtime env
// (Coolify), ne compile-time — domenų/lokalų pririšimas lieka konfigūracija.
export function instanceLocale(): Locale {
	const raw = (SITE_LOCALE ?? '').trim().toLowerCase();
	return (SUPPORTED_LOCALES as readonly string[]).includes(raw)
		? (raw as Locale)
		: DEFAULT_LOCALE;
}

// Paraglide locale source of truth — instance env. Cookie/baseLocale
// strategijos lieka tik kaip fallback jei šis modulis dar neregistruotas.
overwriteGetLocale(() => instanceLocale());

import { localizeHref } from '#lib/paraglide/runtime';

// Vidinių link'ų lokalizacija: '/krepselis' → '/cart' ne-LT instancuose.
// External/mailto/tel/anchor URL'ai paliekami nepakitę; query/hash
// išsaugomi (paraglide dirba tik su pathname dalimi).
export function lh(url: string | null | undefined): string {
	if (!url || !url.startsWith('/')) return url ?? '';
	const hashIdx = url.search(/[?#]/);
	if (hashIdx === -1) return localizeHref(url);
	return localizeHref(url.slice(0, hashIdx)) + url.slice(hashIdx);
}
