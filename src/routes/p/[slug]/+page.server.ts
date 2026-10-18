import { apiFetch, apiFetchRaw, forwardCookies } from '#lib/api/client';
import { getRecommendations } from '#lib/api/endpoints';
import type { CartOut, ProductDetailOut } from '#lib/api/types';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;

	let product: ProductDetailOut;
	try {
		product = await apiFetch<ProductDetailOut>(ctx, `/catalog/products/${slug}`);
	} catch {
		throw error(404, 'Prekė nerasta');
	}

	const recommendations = await getRecommendations(ctx, slug, 'cross_sell', 8).catch(() => []);

	return { product, recommendations };
};

export const actions: Actions = {
	add: async (event) => {
		const ctx = { fetch: event.fetch, request: event.request };
		const form = await event.request.formData();
		const variantId = Number(form.get('variant_id'));
		const qty = Math.max(1, Number(form.get('qty') ?? 1) || 1);
		const offerId = form.get('offer_id');
		if (!variantId) return fail(400, { addError: 'Pasirinkite variantą.' });

		const res = await apiFetchRaw(ctx, '/checkout/cart/items', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				variant_id: variantId,
				qty,
				offer_id: offerId ? Number(offerId) : undefined
			})
		});
		forwardCookies(res, event.cookies);
		if (!res.ok) {
			const detail = await res.json().catch(() => null);
			return fail(res.status, {
				addError: detail?.detail ?? 'Nepavyko pridėti į krepšelį.'
			});
		}
		const cart = (await res.json()) as CartOut;
		return { added: true, cart };
	}
};
