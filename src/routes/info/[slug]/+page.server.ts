import { getCmsPage } from '#lib/api/endpoints';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	try {
		const version = event.url.searchParams.get('version');
		const page = await getCmsPage(ctx, event.params.slug, version);
		return { page, origin: event.url.origin, pathname: event.url.pathname };
	} catch {
		throw error(404, 'Puslapis nerastas');
	}
};
