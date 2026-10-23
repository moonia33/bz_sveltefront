import { browser } from '$app/env';
import { apiFetch, qs, type ApiError } from './client';
import type {
	BrandOut,
	CartOut,
	CatalogFacetsOut,
	CategoryOut,
	CmsPageOut,
	FavoritesOut,
	MeOut,
	OrderOut,
	Paginated,
	ProductDetailOut,
	ProductListOut,
	ShippingMethodOut
} from './types';

type Ctx = Parameters<typeof apiFetch>[0];

export interface ProductListParams {
	q?: string;
	category_slug?: string;
	brand_slug?: string;
	group_code?: string;
	feature?: string;
	option?: string;
	// 'code:min-max[,;code2:min2-max2]' — numeric range facets (F4).
	range?: string;
	sort?: string;
	page?: number;
	page_size?: number;
	in_stock_only?: boolean;
	country_code?: string;
	channel?: string;
}

export function getProducts(ctx: Ctx, p: ProductListParams) {
	return apiFetch<Paginated<ProductListOut>>(ctx, `/catalog/products${qs({ ...p })}`);
}

// Facet aggregation over the whole catalog is the slowest BE call (~2s).
// Facets are public, non-personalized data — cache them briefly server-side.
const FACETS_TTL_MS = 60_000;
const FACETS_MAX_KEYS = 200;
const facetsCache = new Map<string, { t: number; v: Promise<CatalogFacetsOut> }>();

export function getProductFacets(ctx: Ctx, p: Omit<ProductListParams, 'page' | 'page_size' | 'sort'>) {
	const path = `/catalog/products/facets${qs({ ...p })}`;
	if (browser) return apiFetch<CatalogFacetsOut>(ctx, path);
	const hit = facetsCache.get(path);
	if (hit && Date.now() - hit.t < FACETS_TTL_MS) return hit.v;
	const v = apiFetch<CatalogFacetsOut>(ctx, path).catch((e) => {
		facetsCache.delete(path);
		throw e;
	});
	if (facetsCache.size >= FACETS_MAX_KEYS) facetsCache.delete(facetsCache.keys().next().value!);
	facetsCache.set(path, { t: Date.now(), v });
	return v;
}

export function getCategories(ctx: Ctx) {
	return apiFetch<CategoryOut[]>(ctx, '/catalog/categories');
}

export function getBrands(ctx: Ctx) {
	return apiFetch<BrandOut[]>(ctx, '/catalog/brands');
}

export function getBrand(ctx: Ctx, slug: string) {
	return apiFetch<BrandOut>(ctx, `/catalog/brands/${encodeURIComponent(slug)}`);
}

export function getProduct(ctx: Ctx, slug: string, params: Record<string, string> = {}) {
	return apiFetch<ProductDetailOut>(ctx, `/catalog/products/${encodeURIComponent(slug)}${qs(params)}`);
}

export function getRecommendations(
	ctx: Ctx,
	slug: string,
	kind = 'cross_sell',
	limit = 8
) {
	return apiFetch<ProductListOut[]>(
		ctx,
		`/recommendations/products/${encodeURIComponent(slug)}${qs({ kind, limit })}`
	);
}

export function getCart(ctx: Ctx) {
	return apiFetch<CartOut>(ctx, '/checkout/cart');
}

export function getFavorites(ctx: Ctx) {
	return apiFetch<FavoritesOut>(ctx, '/checkout/favorites');
}

export function getFavoriteIds(ctx: Ctx) {
	return apiFetch<{ variant_ids: number[]; product_ids: number[]; count: number }>(
		ctx,
		'/checkout/favorites/ids'
	);
}

export function getMe(ctx: Ctx) {
	return apiFetch<MeOut>(ctx, '/auth/me');
}

export function getOrders(ctx: Ctx, limit = 20) {
	return apiFetch<OrderOut[]>(ctx, `/checkout/orders${qs({ limit })}`);
}

// Viešas order-confirmation lookup: Montonio order-token arba authed order_id.
export function lookupOrder(
	ctx: Ctx,
	params: { order_token?: string; order_id?: number }
) {
	return apiFetch<OrderOut>(
		ctx,
		`/checkout/orders/lookup${qs({
			order_token: params.order_token || undefined,
			order_id: params.order_id || undefined
		})}`
	);
}

export function searchProducts(ctx: Ctx, q: string, limit = 6) {
	return apiFetch<Paginated<ProductListOut>>(
		ctx,
		`/catalog/products${qs({ q, page_size: limit, in_stock_only: undefined })}`
	);
}

export interface HomeSection {
	type: string;
	payload: Record<string, unknown>;
	items?: Array<Record<string, unknown>> | null;
}

export interface HomeSlide {
	image?: { src?: string; alt?: string } | null;
	title?: string;
	subtitle?: string;
	cta?: { label?: string; url?: string } | null;
}

export interface HomeOut {
	code: string;
	title: string;
	seo_title: string;
	seo_description: string;
	updated_at: string;
	sections: HomeSection[];
}

export function getHome(ctx: Ctx) {
	return apiFetch<HomeOut>(ctx, '/home');
}

// Viešas PDP pristatymo blokas — metodai + brutto kainos per šalį.
const SHIP_TTL_MS = 60_000;
const shipCache = new Map<string, { t: number; v: Promise<ShippingMethodOut[]> }>();

export function getShippingMethods(ctx: Ctx, countryCode = 'LT') {
	const path = `/shipping/methods${qs({ country_code: countryCode })}`;
	if (browser) return apiFetch<ShippingMethodOut[]>(ctx, path);
	const hit = shipCache.get(path);
	if (hit && Date.now() - hit.t < SHIP_TTL_MS) return hit.v;
	const v = apiFetch<ShippingMethodOut[]>(ctx, path).catch((e) => {
		shipCache.delete(path);
		throw e;
	});
	if (shipCache.size >= 50) shipCache.delete(shipCache.keys().next().value!);
	shipCache.set(path, { t: Date.now(), v });
	return v;
}

export function getRecentlyViewed(ctx: Ctx) {
	return apiFetch<ProductListOut[]>(ctx, '/catalog/recently-viewed');
}

export function getCmsPage(ctx: Ctx, slug: string) {
	return apiFetch<CmsPageOut>(ctx, `/cms/pages/${encodeURIComponent(slug)}`);
}

export type { ApiError };
