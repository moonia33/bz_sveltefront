import { getMeOrNull, getOrders, getReturns } from '#lib/api/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMeOrNull(ctx);
	if (!me) {
		throw redirect(303, `/prisijungti?next=${encodeURIComponent('/paskyra/grazinimai')}`);
	}
	const [returns, orders] = await Promise.all([
		getReturns(ctx).catch(() => []),
		getOrders(ctx, 50).catch(() => [])
	]);
	// Užsakymai, iš kurių galima kurti naują grąžinimą (pristatyti + grąžinamos eilutės).
	const returnableOrders = orders.filter(
		(o) =>
			Boolean(o.delivered_at) &&
			(o.items ?? []).some((l) => l.returnable && l.qty - (l.returned_qty ?? 0) > 0)
	);
	return { returns, returnableOrders };
};
