import { getBrand, getProducts } from '#lib/api/endpoints';
import type { BrandOut, ProductListOut } from '#lib/api/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;

	const [brand, parent, topProducts] = await Promise.all([
		getBrand(ctx, slug).catch(() => {
			throw error(404, 'Gamintojas nerastas');
		}),
		event.parent(),
		getProducts(ctx, {
			brand_slug: slug,
			sort: 'best_selling',
			in_stock_only: true,
			page_size: 12
		})
			.then((r) => r.items)
			.catch(() => [] as ProductListOut[])
	]);

	return {
		brand: brand as BrandOut,
		all: parent.categories ?? [],
		topProducts,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
