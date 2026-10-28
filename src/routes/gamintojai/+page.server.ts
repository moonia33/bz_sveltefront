import { getBrands } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const brands = await getBrands(ctx).catch(() => []);
	return {
		brands,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
