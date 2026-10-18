import { getHome, getProducts } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	let home = null;
	try {
		home = await getHome(ctx);
	} catch {
		home = null;
	}
	// Fallback: newest products when the home builder page is not configured.
	let fallback = null;
	if (!home || !home.sections?.length) {
		try {
			fallback = await getProducts(ctx, { page_size: 10, sort: '-created' });
		} catch {
			fallback = null;
		}
	}
	return { home, fallback };
};
