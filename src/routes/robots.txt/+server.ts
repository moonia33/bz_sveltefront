import type { RequestHandler } from './$types';

// Filtrų/paieškos/rikiavimo kombinacijos generuoja begalę URL, kurių
// kiekvienas backend'e skaičiuojamas iš naujo — crawler'iams uždrausta.
const PRODUCTION = `User-agent: *
Disallow: /*?*feature=
Disallow: /*?*option=
Disallow: /*?*range=
Disallow: /*?*in_stock_only=
Disallow: /*?*sort=
Disallow: /*?*q=
Disallow: /krepselis
Disallow: /checkout
Disallow: /uzsakymas
Disallow: /paskyra
Disallow: /prisijungti
Disallow: /megstamos
Disallow: /api/
`;

const DISALLOW_ALL = `User-agent: *
Disallow: /
`;

export const GET: RequestHandler = () =>
	new Response(process.env.ROBOTS_DISALLOW_ALL === '1' ? DISALLOW_ALL : PRODUCTION, {
		headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' }
	});
