import { apiFetchRaw, forwardCookies } from '#lib/api/client';
import { getFavorites } from '#lib/api/endpoints';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const favorites = await getFavorites(ctx).catch(() => ({
		items: [],
		variant_ids: [],
		count: 0
	}));
	return { favorites };
};

export const actions: Actions = {
	// Mėgstama → tiesiai į krepšelį (pasirinktu variantu iš select'o).
	cart_add: async (event) => {
		const ctx = { fetch: event.fetch, request: event.request };
		const form = await event.request.formData();
		const variantId = Number(form.get('variant_id'));
		const qty = Math.max(1, Number(form.get('qty') ?? 1) || 1);
		if (!variantId) return fail(400, { error: 'Pasirinkite variantą.' });

		const res = await apiFetchRaw(ctx, '/checkout/cart/items', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ variant_id: variantId, qty })
		});
		forwardCookies(res, event.cookies);
		if (!res.ok) {
			const detail = await res.json().catch(() => null);
			return fail(res.status, {
				error: detail?.detail ?? 'Nepavyko pridėti į krepšelį.'
			});
		}
		return { added: true };
	},

	fav_remove: async (event) => {
		const ctx = { fetch: event.fetch, request: event.request };
		const form = await event.request.formData();
		const variantId = Number(form.get('variant_id'));
		if (!variantId) return fail(400, { error: 'Trūksta varianto.' });

		const res = await apiFetchRaw(
			ctx,
			`/checkout/favorites/${variantId}`,
			{ method: 'DELETE' }
		);
		forwardCookies(res, event.cookies);
		if (!res.ok) {
			return fail(res.status, { error: 'Nepavyko pašalinti.' });
		}
		return { removed: true };
	}
};
