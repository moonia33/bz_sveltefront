import { getBlogPost } from '#lib/api/endpoints';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	let post;
	try {
		post = await getBlogPost(ctx, event.params.slug);
	} catch {
		throw error(404, 'Straipsnis nerastas');
	}
	const base = event.url.pathname.slice(0, event.url.pathname.lastIndexOf('/'));
	if (post.redirect_to_slug && post.redirect_to_slug !== event.params.slug) {
		throw redirect(301, `${base}/${post.redirect_to_slug}`);
	}
	return { post, base, origin: event.url.origin, pathname: event.url.pathname };
};
