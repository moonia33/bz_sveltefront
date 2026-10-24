import {
	getCart,
	getCategories,
	getFavoriteIds,
	getMe,
	getNavigation
} from '#lib/api/endpoints';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [categories, cart, me, favorites, navigation] = await Promise.all([
		getCategories(ctx).catch(() => []),
		getCart(ctx).catch(() => null),
		getMe(ctx).catch(() => null),
		getFavoriteIds(ctx).catch(() => ({
			variant_ids: [] as number[],
			product_ids: [] as number[],
			count: 0
		})),
		getNavigation(ctx).catch(() => null)
	]);
	return {
		categories,
		cart,
		me,
		favorite_count: favorites.count,
		favorite_product_ids: favorites.product_ids,
		navigation
	};
};
