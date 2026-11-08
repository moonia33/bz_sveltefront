import { getActivities } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const activities = await getActivities(ctx).catch(() => {
		throw error(502, 'Nepavyko užkrauti veiklų');
	});
	return {
		areas: activities.filter((a) => a.visible),
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
