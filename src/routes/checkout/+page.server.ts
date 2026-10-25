import { getCart, getMeOrNull, getShippingMethods } from '#lib/api/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [cart, me, shipping_methods] = await Promise.all([
		getCart(ctx).catch(() => null),
		getMeOrNull(ctx),
		getShippingMethods(ctx).catch(() => [])
	]);

	if (!cart || !cart.items?.length) {
		throw redirect(303, '/krepselis');
	}

	return {
		cart,
		me,
		shipping_methods,
		coupon: event.url.searchParams.get('coupon') ?? ''
	};
};
