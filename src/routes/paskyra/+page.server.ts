import { getMeOrNull, getOrders, getReturns } from '#lib/api/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMeOrNull(ctx);
	if (!me) {
		throw redirect(303, `/prisijungti?next=${encodeURIComponent('/paskyra')}`);
	}
	const [orders, returns] = await Promise.all([
		getOrders(ctx).catch(() => []),
		getReturns(ctx).catch(() => [])
	]);
	return { me, orders, returns };
};
