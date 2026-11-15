import { CONSENT_COOKIE } from '#lib/consent';

/** Rekomendacijų sąrašo kontekstas BE metrikoms (`POST /analytics/rec-events`). */
export type RecContext = { kind: string; placement: string; seed?: string };

type RecEvent = {
	name: 'recommendation_impression' | 'recommendation_click';
	kind: string;
	placement: string;
	seed: string;
	nonce: string;
	product_id?: number;
	position?: number;
	items?: { product_id: number; position: number }[];
};

const MAX_PER_POST = 10;
const MAX_ITEMS = 24;
const FLUSH_MS = 2000;

let queue: RecEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

function hasAnalyticsConsent(): boolean {
	const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
	if (!m) return false;
	try {
		return JSON.parse(decodeURIComponent(m[1]))?.analytics === true;
	} catch {
		return false;
	}
}

function nonce(): string {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function flush() {
	if (timer) clearTimeout(timer);
	timer = null;
	while (queue.length) {
		const events = queue.splice(0, MAX_PER_POST);
		fetch('/api/v1/analytics/rec-events', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ events }),
			keepalive: true
		}).catch(() => {});
	}
}

function push(ev: RecEvent) {
	if (!hasAnalyticsConsent()) return;
	queue.push(ev);
	if (!listening) {
		listening = true;
		addEventListener('pagehide', flush);
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') flush();
		});
	}
	if (queue.length >= MAX_PER_POST) flush();
	else timer ??= setTimeout(flush, FLUSH_MS);
}

export function trackRecImpression(ctx: RecContext, productIds: number[]) {
	if (!productIds.length) return;
	push({
		name: 'recommendation_impression',
		kind: ctx.kind,
		placement: ctx.placement,
		seed: ctx.seed ?? '',
		nonce: nonce(),
		items: productIds.slice(0, MAX_ITEMS).map((product_id, position) => ({ product_id, position }))
	});
}

/** Paspaudimas iškart (keepalive) – vartotojas tuoj išeina iš puslapio. */
export function trackRecClick(ctx: RecContext, productId: number, position: number) {
	push({
		name: 'recommendation_click',
		kind: ctx.kind,
		placement: ctx.placement,
		seed: ctx.seed ?? '',
		nonce: nonce(),
		product_id: productId,
		position
	});
	flush();
}
