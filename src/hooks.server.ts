import * as Sentry from '@sentry/sveltekit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { instanceLocale } from '#lib/i18n/instance';
import { paraglideMiddleware } from '#lib/paraglide/server';
import { getTextDirection } from '#lib/paraglide/runtime';

const appHandle: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme') === 'dark' ? 'dark' : '';
	// Middleware locale param ateina iš strategy grandinės — mums svarbiau
	// yra instance env (viena kalba per deploy), tiek %lang% tiek m.*()
	// resolve'inami per overwriteGetLocale → instanceLocale().
	const locale = instanceLocale();
	const response = await paraglideMiddleware(event.request, ({ request }) =>
		resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%theme%', theme)
						.replace('%lang%', locale)
						.replace('%dir%', getTextDirection(locale))
			}
		)
	);
	if (process.env.ROBOTS_DISALLOW_ALL === '1') {
		response.headers.set('x-robots-tag', 'noindex, nofollow');
	}
	return response;
};

export const handle = sequence(Sentry.sentryHandle(), appHandle);
export const handleError = Sentry.handleErrorWithSentry();
