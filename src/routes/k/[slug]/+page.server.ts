import { apiFetch } from '#lib/api/client';
import { getProductFacets, getProducts } from '#lib/api/endpoints';
import type { CategoryOut } from '#lib/api/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;
	const sp = event.url.searchParams;

	const filters = {
		q: sp.get('q') ?? undefined,
		category_slug: slug,
		brand_slug: sp.get('brand_slug') ?? undefined,
		group_code: sp.get('group_code') ?? undefined,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		range: sp.get('range') ?? undefined,
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [category, parent, listingProducts, listingFacets] = await Promise.all([
		apiFetch<CategoryOut>(ctx, `/catalog/categories/${slug}`).catch(() => {
			throw error(404, 'Kategorija nerasta');
		}),
		event.parent(),
		getProducts(ctx, filters).catch(() => null),
		getProductFacets(ctx, filters).catch(() => null)
	]);

	const all = parent.categories ?? [];
	const children = all.filter((c) => c.parent_id === category.id);

	// Breadcrumb chain: walk parent_id up to root.
	const parentChain: CategoryOut[] = [];
	let cur = category;
	const seen = new Set<number>();
	while (cur.parent_id != null && !seen.has(cur.id)) {
		seen.add(cur.id);
		const p = all.find((c) => c.id === cur.parent_id);
		if (!p) break;
		parentChain.unshift(p);
		cur = p;
	}

	const common = {
		category,
		all,
		children,
		parentChain,
		params: Object.fromEntries(sp),
		origin: event.url.origin,
		pathname: event.url.pathname
	};

	// API klaida listing'e propaguojama kaip anksčiau (500), o ne
	// nutylima tuščiu katalogu.
	if (!listingProducts || !listingFacets) {
		throw error(502, 'Nepavyko užkrauti katalogo');
	}
	const products = listingProducts;
	const facets = listingFacets;

	const filterParams = ['brand_slug', 'group_code', 'feature', 'option', 'range', 'in_stock_only', 'q'];
	const nofollow = filterParams.some((k) => sp.has(k));
	const noindex = nofollow || filters.page > 1;

	return {
		...common,
		products,
		facets,
		categoryChips: children,
		categoryLinks: children.map((c) => ({ slug: c.slug, name: c.name })),
		mode: 'listing' as const,
		noindex,
		nofollow
	};
};
