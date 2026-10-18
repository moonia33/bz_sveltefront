import { getCart, getCategories, getMe } from '#lib/api/endpoints';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [categories, cart, me] = await Promise.all([
		getCategories(ctx).catch(() => []),
		getCart(ctx).catch(() => null),
		getMe(ctx).catch(() => null)
	]);
	return {
		categories,
		cartCount: cart?.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0,
		me
	};
};
