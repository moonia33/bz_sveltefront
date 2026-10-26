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

// Backend sits behind the same TLS proxy; without the original scheme Django
// (SECURE_SSL_REDIRECT) answers internal plain-HTTP calls with a redirect.
function forwardProto(request: Request, headers: Headers) {
	const proto = request.headers.get('x-forwarded-proto') ?? new URL(request.url).protocol.replace(':', '');
	if (proto) headers.set('X-Forwarded-Proto', proto);
}

// Node's fetch always sends Host from the target URL, so the storefront host
// (= shop domain) also travels as X-Forwarded-Host (backend: USE_X_FORWARDED_HOST).
export function forwardHost(request: Request, headers: Headers) {
	const host = request.headers.get('host');
	if (!host) return;
	headers.set('Host', host);
	headers.set('X-Forwarded-Host', host);
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
		forwardHost(ctx.request, headers);
		const cookie = ctx.request.headers.get('cookie');
		if (cookie) headers.set('Cookie', cookie);
		const lang = ctx.request.headers.get('accept-language');
		if (lang) headers.set('Accept-Language', lang);
		forwardProto(ctx.request, headers);
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
	if (ctx.request) forwardHost(ctx.request, headers);
	const cookie = ctx.request?.headers.get('cookie');
	if (cookie) headers.set('Cookie', cookie);
	if (!browser && ctx.request) forwardProto(ctx.request, headers);
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
