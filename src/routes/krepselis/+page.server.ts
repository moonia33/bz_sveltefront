import { apiFetchRaw, forwardCookies } from '#lib/api/client';
import { getCart } from '#lib/api/endpoints';
import type { CartOut } from '#lib/api/types';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const cart = await getCart(ctx).catch(() => null);
	return { cart };
};

async function mutate(
	event: RequestEvent,
	method: string,
	path: string,
	body?: Record<string, unknown>
) {
	const ctx = { fetch: event.fetch, request: event.request };
	const res = await apiFetchRaw(ctx, path, {
		method,
		headers: { 'Content-Type': 'application/json' },
		body: body ? JSON.stringify(body) : undefined
	});
	forwardCookies(res, event.cookies);
	if (!res.ok) {
		const detail = await res.json().catch(() => null);
		return fail(res.status, { error: detail?.detail ?? 'Veiksmas nepavyko.' });
	}
	return { cart: (await res.json()) as CartOut };
}

export const actions: Actions = {
	update: async (event) => {
		const form = await event.request.formData();
		const id = form.get('item_id');
		const qty = Number(form.get('qty'));
		if (!id || !Number.isFinite(qty) || qty < 0) return fail(400, { error: 'Neteisingas kiekis.' });
		return mutate(event, 'PATCH', `/checkout/cart/items/${id}`, { qty });
	},
	remove: async (event) => {
		const form = await event.request.formData();
		const id = form.get('item_id');
		if (!id) return fail(400, { error: 'Trūksta eilutės.' });
		return mutate(event, 'DELETE', `/checkout/cart/items/${id}`);
	},
	// „Save for later": variantas → į mėgstamas, eilutė → iš krepšelio.
	fav_remove: async (event) => {
		const ctx = { fetch: event.fetch, request: event.request };
		const form = await event.request.formData();
		const id = form.get('item_id');
		const variantId = Number(form.get('variant_id'));
		if (!id || !variantId) return fail(400, { error: 'Trūksta eilutės arba varianto.' });

		const favRes = await apiFetchRaw(ctx, '/checkout/favorites', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ variant_id: variantId })
		});
		forwardCookies(favRes, event.cookies);
		// Net jei favorite jau yra — krepšelio eilutę vis tiek šaliname.
		return mutate(event, 'DELETE', `/checkout/cart/items/${id}`);
	}
};
