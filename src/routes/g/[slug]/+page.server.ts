import { getBrand, EMPTY_FACETS, getProductFacets, getProducts, loadFacets } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;
	const sp = event.url.searchParams;
	const filters = {
		q: sp.get('q') ?? undefined,
		category_slug: sp.get('category_slug') ?? undefined,
		brand_slug: slug,
		group_code: sp.get('group_code') ?? undefined,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		range: sp.get('range') ?? undefined,
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [brand, products, { facets: loadedFacets }, parent] = await Promise.all([
		getBrand(ctx, slug).catch(() => {
			throw error(404, 'Gamintojas nerastas');
		}),
		getProducts(ctx, filters).catch(() => ({ count: 0, items: [] })),
		loadFacets(event, getProductFacets(ctx, filters)),
		event.parent()
	]);

	const facets = loadedFacets ?? EMPTY_FACETS;
	const q = sp.get('q') ?? '';
	const nofollow =
		['category_slug', 'group_code', 'feature', 'option', 'range', 'in_stock_only'].some((k) =>
			sp.has(k)
		) ||
		!!q;
	const noindex = nofollow || filters.page > 1;

	return {
		brand,
		products,
		facets,
		params: Object.fromEntries(sp),
		// Visas kategorijų sąrašas — pasirinktos kategorijos chip'o
		// pavadinimui sidebar'e (facets.categories rodo tik drill-down lygį).
		allCategories: parent.categories ?? [],
		title: brand.name,
		description:
			brand.seo_description || brand.description || `Visos ${brand.name} prekės.`,
		seoTitle: brand.seo_title || '',
		logoUrl: brand.logo_url || '',
		noindex,
		nofollow,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
