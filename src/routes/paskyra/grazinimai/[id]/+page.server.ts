import { getMe, getReturn } from '#lib/api/endpoints';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMe(ctx).catch(() => null);
	if (!me) {
		throw redirect(
			303,
			`/prisijungti?next=${encodeURIComponent(`/paskyra/grazinimai/${event.params.id}`)}`
		);
	}
	const ret = await getReturn(ctx, Number(event.params.id)).catch(() => null);
	if (!ret) throw error(404, 'Grąžinimas nerastas');
	return { ret };
};
