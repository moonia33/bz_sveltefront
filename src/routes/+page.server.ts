import { getActivities, getHome, getProducts, getRecentlyViewed } from '#lib/api/endpoints';
import type { ActivityOut } from '#lib/api/types';
import type { ProductListOut } from '#lib/api/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [home, recentlyViewed, newest, activities] = await Promise.all([
		getHome(ctx).catch(() => null),
		getRecentlyViewed(ctx).catch(() => [] as ProductListOut[]),
		getProducts(ctx, { sort: '-created', page_size: 12 }).catch(() => null),
		getActivities(ctx).catch(() => [] as ActivityOut[])
	]);
	const activityAreas = activities.filter((a) => a.visible && a.children.some((c) => c.visible));
	return { home, recentlyViewed, newest, activityAreas, origin: event.url.origin };
};
