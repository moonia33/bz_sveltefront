import { getActivities } from '#lib/api/endpoints';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const activities = await getActivities(ctx).catch(() => []);
	return {
		areas: activities.filter((a) => a.visible),
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
