import { getProductGroups } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const groups = await getProductGroups(ctx).catch(() => []);
	return {
		groups,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
