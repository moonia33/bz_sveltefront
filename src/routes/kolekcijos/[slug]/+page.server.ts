import { EMPTY_FACETS, getProductFacets, getProductGroup, getProducts, loadFacets } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;
	const sp = event.url.searchParams;
	const filters = {
		q: sp.get('q') ?? undefined,
		category_slug: sp.get('category_slug') ?? undefined,
		brand_slug: sp.get('brand_slug') ?? undefined,
		group_code: slug,
		feature: sp.get('feature') ?? undefined,
		option: sp.get('option') ?? undefined,
		range: sp.get('range') ?? undefined,
		sort: sp.get('sort') ?? undefined,
		in_stock_only: sp.get('in_stock_only') === '1',
		page: Number(sp.get('page') ?? 1) || 1
	};

	const [group, products, { facets: loadedFacets }, parent] = await Promise.all([
		getProductGroup(ctx, slug).catch(() => {
			throw error(404, 'Kolekcija nerasta');
		}),
		getProducts(ctx, filters).catch(() => ({ count: 0, items: [] })),
		loadFacets(event, getProductFacets(ctx, filters)),
		event.parent()
	]);

	const facets = loadedFacets ?? EMPTY_FACETS;
	const q = sp.get('q') ?? '';
	const nofollow =
		['category_slug', 'brand_slug', 'feature', 'option', 'range', 'in_stock_only'].some((k) =>
			sp.has(k)
		) ||
		!!q;
	const noindex = nofollow || filters.page > 1;

	return {
		group,
		products,
		facets,
		params: Object.fromEntries(sp),
		categoryChips: (parent.categories ?? []).filter((c) => !c.parent_id),
		title: group.name,
		description: group.description || `Kolekcija: ${group.name}`,
		noindex,
		nofollow,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
