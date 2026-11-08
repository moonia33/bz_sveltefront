import { apiFetch } from '#lib/api/client';
import { instanceLocale } from '#lib/i18n/instance';
import type { RequestHandler } from './$types';

type Entry = { language_code: string; slug: string; updated_at: string };

const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: RequestHandler = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const entries = await apiFetch<Entry[]>(ctx, '/cms/blog/sitemap').catch(() => [] as Entry[]);
	const lang = instanceLocale();
	const origin = event.url.origin;
	const base = lang === 'lt' ? '/patarimai' : '/blog';
	const urls = entries
		.filter((e) => e.language_code === lang)
		.map(
			(e) =>
				`<url><loc>${esc(`${origin}${base}/${e.slug}`)}</loc><lastmod>${esc(e.updated_at)}</lastmod></url>`
		);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${esc(origin + base)}</loc></url>
${urls.join('\n')}
</urlset>`;
	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
};
