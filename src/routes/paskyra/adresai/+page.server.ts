import { getMe } from '#lib/api/endpoints';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const me = await getMe(ctx).catch(() => null);
	if (!me) {
		throw redirect(303, `/prisijungti?next=${encodeURIComponent('/paskyra/adresai')}`);
	}
	return { me };
};
