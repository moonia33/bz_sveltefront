import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme') === 'dark' ? 'dark' : '';
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%theme%', theme)
	});
	if (process.env.ROBOTS_DISALLOW_ALL === '1') {
		response.headers.set('x-robots-tag', 'noindex, nofollow');
	}
	return response;
};
