import { getMeOrNull, getOrder, getOrders } from '#lib/api/endpoints';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMeOrNull(ctx);
	if (!me) {
		throw redirect(303, `/prisijungti?next=${encodeURIComponent('/paskyra/grazinimai/naujas')}`);
	}
	const orderId = Number(event.url.searchParams.get('order') || 0) || null;
	const orders = await getOrders(ctx, 50).catch(() => []);
	const returnableOrders = orders.filter(
		(o) =>
			Boolean(o.delivered_at) &&
			(o.items ?? []).some((l) => l.returnable && l.qty - (l.returned_qty ?? 0) > 0)
	);
	let order = null;
	if (orderId) {
		order = await getOrder(ctx, orderId).catch(() => null);
		if (!order) throw error(404, 'Užsakymas nerastas');
	} else if (returnableOrders.length === 1) {
		order = returnableOrders[0];
	}
	return { order, returnableOrders };
};
