import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// Instance kalba — runtime env per Coolify instance (vienas app = viena
	// kalba/domenas). static:false → skaitoma start'e, ne inlined build'e.
	SITE_LOCALE: {
		public: true,
		schema: (value) => value?.trim().toLowerCase() || 'lt'
	}
});
