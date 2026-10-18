import { browser } from '$app/env';

const API_BASE = (process.env.API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

interface Ctx {
	fetch: typeof fetch;
	request?: Request; // SvelteKit server event request (for Host/Cookie forwarding)
	url?: URL;
}

function buildUrl(path: string): string {
	// Browser: go through the same-origin proxy route so HttpOnly cookies flow.
	if (browser) return `/api/v1${path}`;
	return `${API_BASE}/api/v1${path}`;
}

export async function apiFetch<T = unknown>(
	ctx: Ctx,
	path: string,
	init: RequestInit = {}
): Promise<T> {
	const headers = new Headers(init.headers);
	headers.set('Accept', 'application/json');

	if (!browser && ctx.request) {
		// Forward shop context: the storefront host IS the shop domain.
		const host = ctx.request.headers.get('host');
		if (host) headers.set('Host', host);
		const cookie = ctx.request.headers.get('cookie');
		if (cookie) headers.set('Cookie', cookie);
		const lang = ctx.request.headers.get('accept-language');
		if (lang) headers.set('Accept-Language', lang);
	}

	const res = await ctx.fetch(buildUrl(path), { ...init, headers });
	if (!res.ok) {
		let detail = res.statusText;
		try {
			const body = await res.json();
			detail = body?.detail || body?.message || detail;
		} catch {
			/* non-JSON error body */
		}
		throw new ApiError(res.status, String(detail));
	}
	if (res.status === 204) return undefined as T;
	return res.json() as Promise<T>;
}

export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue;
		sp.set(k, String(v));
	}
	const s = sp.toString();
	return s ? `?${s}` : '';
}

/** Server-side fetch that returns the raw Response (for Set-Cookie forwarding). */
export async function apiFetchRaw(
	ctx: Ctx,
	path: string,
	init: RequestInit = {}
): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('Accept', 'application/json');
	const host = ctx.request?.headers.get('host');
	if (host) headers.set('Host', host);
	const cookie = ctx.request?.headers.get('cookie');
	if (cookie) headers.set('Cookie', cookie);
	return ctx.fetch(buildUrl(path), { ...init, headers });
}

/** Re-set upstream Set-Cookie headers on the SvelteKit response. */
export function forwardCookies(
	upstream: Response,
	cookies: {
		set: (name: string, value: string, opts: Record<string, unknown>) => void;
	}
) {
	for (const header of upstream.headers.getSetCookie?.() ?? []) {
		const [pair] = header.split(';');
		const eq = pair.indexOf('=');
		if (eq <= 0) continue;
		cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim(), { path: '/' });
	}
}
