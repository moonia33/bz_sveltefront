import { apiFetch } from '#lib/api/client';
import { getProductFacets, getProducts } from '#lib/api/endpoints';
import type { CategoryOut } from '#lib/api/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;
	const sp = event.url.searchParams;

	let category: CategoryOut;
	try {
		category = await apiFetch<CategoryOut>(ctx, `/catalog/categories/${slug}`);
	} catch {
		throw error(404, 'Kategorija nerasta');
	}

	const filters = {
		q: sp.get('q') ?? undefined,
		category_slug: slug,
		brand_slug: sp.get('brand_slug') ?? undefined,
		group_code: sp.get('group_code') ?? undefined,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [products, facets] = await Promise.all([
		getProducts(ctx, filters),
		getProductFacets(ctx, filters)
	]);
	return { category, products, facets, params: Object.fromEntries(sp) };
};
