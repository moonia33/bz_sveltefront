import type { RequestHandler } from './$types';
import { forwardHost } from '#lib/api/client';
import { instanceLocale } from '#lib/i18n/instance';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const HOP_BY_HOP = new Set([
	'connection',
	'keep-alive',
	'transfer-encoding',
	'upgrade',
	'host',
	'content-length'
]);

async function proxy({ request, params, url }: Parameters<RequestHandler>[0]) {
	const target = `${API_BASE}/api/v1/${params.path ?? ''}${url.search}`;

	const headers = new Headers();
	for (const [k, v] of request.headers) {
		if (!HOP_BY_HOP.has(k.toLowerCase())) headers.set(k, v);
	}
	// Shop context: storefront host == shop domain.
	forwardHost(request, headers);
	// Instance kalba laimi prieš browserio Accept-Language — domenas yra
	// autoritetas (PL domain'o vartotojas su EN browser'iu vis tiek nori PL).
	headers.set('accept-language', instanceLocale());

	const hasBody = !['GET', 'HEAD'].includes(request.method);
	const upstream = await fetch(target, {
		method: request.method,
		headers,
		body: hasBody ? await request.arrayBuffer() : undefined,
		// @ts-expect-error Node fetch needs duplex for streamed bodies
		duplex: 'half'
	});

	const out = new Headers();
	for (const [k, v] of upstream.headers) {
		if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== 'set-cookie') {
			out.set(k, v);
		}
	}
	for (const sc of upstream.headers.getSetCookie?.() ?? []) {
		out.append('Set-Cookie', sc);
	}
	return new Response(upstream.body, { status: upstream.status, headers: out });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
