import { getMe, getOrders } from '#lib/api/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMe(ctx).catch(() => null);
	if (!me) {
		throw redirect(303, `/prisijungti?next=${encodeURIComponent('/paskyra/uzsakymai')}`);
	}
	const orders = await getOrders(ctx, 50).catch(() => []);
	return { orders };
};
