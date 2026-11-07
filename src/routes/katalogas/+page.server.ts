import { getProducts } from '#lib/api/endpoints';
import type { CatalogFacetsOut } from '#lib/api/types';
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
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	// Facet'ų puslapyje nėra (sidebar'e — kategorijų medis): brangi
	// /catalog/products/facets užklausa čia visai nekviečiama.
	const facets: CatalogFacetsOut = {
		categories: [],
		brands: [],
		product_groups: [],
		features: [],
		option_types: []
	};
	const [products, parent] = await Promise.all([
		getProducts(ctx, filters),
		event.parent()
	]);

	const q = sp.get('q') ?? '';
	const filterParams = [
		'brand_slug',
		'group_code',
		'feature',
		'option',
		'range',
		'in_stock_only',
		'category_slug'
	];
	const nofollow = filterParams.some((k) => sp.has(k)) || !!q;
	const noindex = nofollow || filters.page > 1;

	return {
		products,
		facets,
		params: Object.fromEntries(sp),
		categoryChips: (parent.categories ?? []).filter((c) => !c.parent_id),
		navTree: parent.categories ?? [],
		title: q ? `Paieška: „${q}“` : 'Visos prekės',
		noindex,
		nofollow,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
