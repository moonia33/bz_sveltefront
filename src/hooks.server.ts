import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme') === 'dark' ? 'dark' : '';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%theme%', theme)
	});
};
