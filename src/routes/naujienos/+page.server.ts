import { getProductFacets, getProducts } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const sp = event.url.searchParams;
	const filters = {
		q: sp.get('q') ?? undefined,
		category_slug: sp.get('category_slug') ?? undefined,
		brand_slug: sp.get('brand_slug') ?? undefined,
		group_code: sp.get('group_code') ?? undefined,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		range: sp.get('range') ?? undefined,
		sort: sp.get('sort') ?? '-created',
		in_stock_only: sp.get('in_stock_only') === '1',
		collection: 'new' as const,
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [products, facets, parent] = await Promise.all([
		getProducts(ctx, filters),
		getProductFacets(ctx, filters),
		event.parent()
	]);

	const q = sp.get('q') ?? '';
	const nofollow = ['brand_slug','group_code','feature','option','range','in_stock_only','category_slug']
		.some((k) => sp.has(k)) || !!q;
	const noindex = nofollow || filters.page > 1;

	return {
		products,
		facets,
		params: Object.fromEntries(sp),
		categoryChips: (parent.categories ?? []).filter((c) => !c.parent_id),
		title: 'Naujausios prekės',
		description: 'Naujausią žvejybos inventorinę rinkoje.',
		noindex,
		nofollow,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
