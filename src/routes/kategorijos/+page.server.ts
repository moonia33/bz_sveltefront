import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const parent = await event.parent();
	const all = parent.categories ?? [];
	const ids = new Set(all.map((c) => c.id));
	// Roots: parent_id null OR a dangling parent not present in the list.
	const roots = all.filter((c) => c.parent_id == null || !ids.has(c.parent_id));
	return {
		all,
		roots,
		origin: event.url.origin,
		pathname: event.url.pathname
	};
};
