import { getHome, getProducts, getRecentlyViewed } from '#lib/api/endpoints';
import type { ProductListOut } from '#lib/api/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [home, recentlyViewed, newest] = await Promise.all([
		getHome(ctx).catch(() => null),
		getRecentlyViewed(ctx).catch(() => [] as ProductListOut[]),
		getProducts(ctx, { sort: '-created', page_size: 12 }).catch(() => null)
	]);
	return { home, recentlyViewed, newest, origin: event.url.origin };
};
