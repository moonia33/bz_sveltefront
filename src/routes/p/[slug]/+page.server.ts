import { apiFetch, apiFetchRaw, forwardCookies } from '#lib/api/client';
import { getFavoriteIds, getRecommendations, getShippingMethods } from '#lib/api/endpoints';
import type { CartOut, ProductDetailOut, ShippingMethodOut } from '#lib/api/types';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const slug = event.params.slug;

	// Visi užklausimai lygiagrečiai — rekomendacijoms užtenka route slug'o,
	// prekės atsakymo joms nereikia. 404 metamas iškart, kai prekė
	// nepavyksta (likusieji promise'ai tęsia foniniame režime).
	const productP = apiFetch<ProductDetailOut>(ctx, `/catalog/products/${slug}`).catch(
		() => null
	);
	const recsP = Promise.all([
		getRecommendations(ctx, slug, 'cross_sell', 8).catch(() => []),
		getShippingMethods(ctx).catch(() => [] as ShippingMethodOut[]),
		getFavoriteIds(ctx).catch(() => ({ variant_ids: [] as number[], count: 0 }))
	]);

	const product = await productP;
	if (!product) {
		throw error(404, 'Prekė nerasta');
	}
	// Senas arba kitos kalbos slug'as -> kanoninis adresas (SEO).
	if (product.slug && product.slug !== slug) {
		throw redirect(301, `/p/${encodeURIComponent(product.slug)}${event.url.search}`);
	}
	const [recommendations, shipping_methods, favoriteIds] = await recsP;

	return {
		product,
		recommendations,
		shipping_methods,
		favorite_ids: favoriteIds.variant_ids,
		origin: event.url.origin
	};
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
	},

	// Heart toggle: prideda/pašalina variantą iš mėgstamų.
	fav: async (event) => {
		const ctx = { fetch: event.fetch, request: event.request };
		const form = await event.request.formData();
		const variantId = Number(form.get('variant_id'));
		const isFav = form.get('is_fav') === '1';
		if (!variantId) return fail(400, { addError: 'Pasirinkite variantą.' });

		const res = await apiFetchRaw(
			ctx,
			isFav ? `/checkout/favorites/${variantId}` : '/checkout/favorites',
			isFav
				? { method: 'DELETE' }
				: {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ variant_id: variantId })
					}
		);
		forwardCookies(res, event.cookies);
		if (!res.ok) {
			return fail(res.status, { favError: 'Nepavyko atnaujinti mėgstamų.' });
		}
		return { favToggled: true };
	}
};
