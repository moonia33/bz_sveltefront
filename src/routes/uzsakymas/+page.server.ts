import { lookupOrder } from '#lib/api/endpoints';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Grįžta iš Montonio (?order-token=…), Inbank (?sessionUuid=…) arba
// FE nuoroda (?order=123, auth).
export const load: PageServerLoad = async (event) => {
	const orderToken = (event.url.searchParams.get('order-token') ?? '').trim();
	const sessionUuid = (
		event.url.searchParams.get('sessionUuid') ??
		event.url.searchParams.get('session_uuid') ??
		''
	).trim();
	const orderId = Number(event.url.searchParams.get('order') ?? '');
	if (!orderToken && !sessionUuid && !orderId) {
		redirect(303, '/');
	}

	const ctx = { fetch: event.fetch, request: event.request };
	const order = await lookupOrder(ctx, {
		order_token: orderToken || undefined,
		order_id: orderId || undefined,
		session_uuid: sessionUuid || undefined
	}).catch(() => null);

	if (!order) {
		error(404, 'Užsakymas nerastas.');
	}
	return { order };
};
