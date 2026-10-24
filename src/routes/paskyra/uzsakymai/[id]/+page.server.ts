import { getMe, getOrder } from '#lib/api/endpoints';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMe(ctx).catch(() => null);
	if (!me) {
		throw redirect(
			303,
			`/prisijungti?next=${encodeURIComponent(`/paskyra/uzsakymai/${event.params.id}`)}`
		);
	}
	const order = await getOrder(ctx, Number(event.params.id)).catch(() => null);
	if (!order) throw error(404, 'Užsakymas nerastas');
	return { order };
};
