import { getBlogCategories, getBlogPosts } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 12;

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const page = Math.max(1, Number(event.url.searchParams.get('page')) || 1);
	const category = event.url.searchParams.get('kategorija') || undefined;
	const [posts, categories] = await Promise.all([
		getBlogPosts(ctx, { page, page_size: PAGE_SIZE, category }),
		getBlogCategories(ctx).catch(() => [])
	]);
	return {
		posts,
		categories: categories.filter((c) => c.post_count > 0),
		category: category ?? null,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
