import { getActivity, getProductFacets, getProducts } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const code = event.params.code;
	const sp = event.url.searchParams;
	const filters = {
		q: sp.get('q') ?? undefined,
		activity: code,
		category_slug: sp.get('category_slug') ?? undefined,
		brand_slug: sp.get('brand_slug') ?? undefined,
		group_code: sp.get('group_code') ?? undefined,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		range: sp.get('range') ?? undefined,
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [activity, products, facets, parent] = await Promise.all([
		getActivity(ctx, code).catch(() => null),
		getProducts(ctx, filters).catch(() => null),
		getProductFacets(ctx, filters).catch(() => null),
		event.parent()
	]);
	if (!activity || !activity.visible) throw error(404, 'Veikla nerasta');
	if (!products || !facets) throw error(502, 'Nepavyko užkrauti katalogo');

	const nofollow = ['q', 'category_slug', 'brand_slug', 'group_code', 'feature', 'option', 'range', 'in_stock_only'].some(
		(k) => sp.has(k)
	);
	return {
		activity,
		products,
		facets,
		params: Object.fromEntries(sp),
		allCategories: parent.categories ?? [],
		noindex: nofollow || filters.page > 1,
		nofollow,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
