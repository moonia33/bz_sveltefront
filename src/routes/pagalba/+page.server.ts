import { getCmsCategories } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const categories = await getCmsCategories(ctx).catch(() => []);
	return { categories };
};
