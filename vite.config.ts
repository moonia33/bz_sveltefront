import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

// Kalbos per instance — PUBLIC_SITE_LOCALE env (vienas Coolify app = viena
// kalba/domenas). urlPatterns čia TIK pathname lokalizacijai — domenai
// nefiksuoti compile-time, nes jų sąrašas ateina iš backend API.
const LOCALES = ['lt', 'pl', 'en', 'de', 'lv', 'et'] as const;

// Canonical (LT, kaip src/routes) → ne-LT localized pathname (EN-stiliaus —
// neutralu visoms kalboms; konkrečios kalbos vėliau galima pakeisti tik
// redaguojant šią lentelę).
const ROUTE_ALIASES: Record<string, string> = {
	'/akcijos': '/deals',
	'/gamintojai': '/brands',
	'/grazinimas': '/returns',
	'/ispardavimas': '/outlet',
	'/katalogas': '/catalog',
	'/kategorijos': '/categories',
	'/kolekcijos': '/collections',
	'/krepselis': '/cart',
	'/megstamos': '/favorites',
	'/naujienos': '/news',
	'/pagalba': '/help',
	'/parduotuves': '/stores',
	'/paskyra': '/account',
	'/prisijungti': '/login',
	'/uzsakymas': '/order'
};

type LocalizedTuple = [(typeof LOCALES)[number], string];

const urlPatterns: { pattern: string; localized: LocalizedTuple[] }[] = [
	...Object.entries(ROUTE_ALIASES).flatMap(([ltPath, enPath]) => [
		{
			pattern: ltPath,
			localized: [
				['lt', ltPath] as LocalizedTuple,
				...LOCALES.filter((l) => l !== 'lt').map(
					(l) => [l, enPath] as LocalizedTuple
				)
			]
		},
		{
			pattern: `${ltPath}/:sub(.*)?`,
			localized: [
				['lt', `${ltPath}/:sub(.*)?`] as LocalizedTuple,
				...LOCALES.filter((l) => l !== 'lt').map(
					(l) => [l, `${enPath}/:sub(.*)?`] as LocalizedTuple
				)
			]
		}
	]),
	{
		pattern: '/:path(.*)?',
		localized: LOCALES.map((l) => [l, '/:path(.*)?'] as LocalizedTuple)
	}
];

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			strategy: ['cookie', 'baseLocale'],
			urlPatterns,
			routeStrategies: [{ match: '/api/:path(.*)?', exclude: true }]
		})
	]
});
