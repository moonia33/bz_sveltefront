import { getCmsCategories, getCmsCategoryPages } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.cat;
	const [categories, pages] = await Promise.all([
		getCmsCategories(ctx).catch(() => []),
		getCmsCategoryPages(ctx, slug).catch(() => null)
	]);
	if (pages === null) throw error(404, 'Kategorija nerasta');
	const category = categories.find((c) => c.slug === slug) ?? null;
	return { category, slug, pages };
};
