import type { ShopConfigOut } from '#lib/api/types';

export const FALLBACK_LOGO_URL = 'https://baltijoszvynas.lt/img/logo-1715070576.jpg';

export function shopLogoUrl(config: ShopConfigOut | null | undefined): string {
	return config?.logo_url || FALLBACK_LOGO_URL;
}
