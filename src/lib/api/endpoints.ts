import { browser } from '$app/env';
import { apiFetch, qs, type ApiError } from './client';
import type {
	AddressOut,
	BrandOut,
	CartOut,
	CatalogFacetsOut,
	CategoryOut,
	CmsCategoryOut,
	CmsPageListOut,
	CmsPageOut,
	FavoritesOut,
	GiftCardOut,
	MeOut,
	NavigationOut,
	NewsletterStatusOut,
	OrderOut,
	Paginated,
	ProductDetailOut,
	ProductListOut,
	ReturnOut,
	ShippingMethodOut,
	StoreLocationOut
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
	collection?: 'new' | 'sale';
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

export function getProductGroup(ctx: Ctx, code: string) {
	return apiFetch<{ id: number; code: string; name: string; description: string }>(
		ctx,
		`/catalog/product-groups/${encodeURIComponent(code)}`
	);
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

/** Ar request'e yra auth cookie (BE: AUTH_COOKIE_ACCESS_NAME=access_token). */
export function hasAuthCookie(ctx: Ctx): boolean {
	if (browser) return true; // klientui cookie nusprendžia pats fetch
	const cookie = ctx.request?.headers.get('cookie') ?? '';
	return /(?:^|;\s*)access_token=/.test(cookie);
}

/** getMe, bet guest'ams be auth cookie – null vietoj 401 (BE logai švarūs). */
export function getMeOrNull(ctx: Ctx): Promise<MeOut | null> {
	if (!hasAuthCookie(ctx)) return Promise.resolve(null);
	return getMe(ctx).catch(() => null);
}

function json<T>(ctx: Ctx, path: string, method: string, body?: unknown) {
	return apiFetch<T>(ctx, path, {
		method,
		headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});
}

export function updateMe(ctx: Ctx, payload: { first_name?: string; last_name?: string; phone?: string }) {
	return json<MeOut>(ctx, '/auth/me', 'PATCH', payload);
}

export function updateConsents(ctx: Ctx, items: { key: string; accepted: boolean }[]) {
	return json<MeOut>(ctx, '/auth/consents', 'PUT', { items });
}

export interface AddressPayload {
	label?: string;
	full_name?: string;
	company?: string;
	company_reg_no?: string;
	company_vat_no?: string;
	line1?: string;
	city?: string;
	postal_code?: string;
	country_code?: string;
	phone?: string;
	is_default_shipping?: boolean;
	is_default_billing?: boolean;
}

export function createAddress(ctx: Ctx, payload: AddressPayload) {
	return json<AddressOut>(ctx, '/auth/addresses', 'POST', payload);
}

export function updateAddress(ctx: Ctx, id: number, payload: AddressPayload) {
	return json<AddressOut>(ctx, `/auth/addresses/${id}`, 'PATCH', payload);
}

export function deleteAddress(ctx: Ctx, id: number) {
	return json<void>(ctx, `/auth/addresses/${id}`, 'DELETE');
}

export function getOrders(ctx: Ctx, limit = 20) {
	return apiFetch<OrderOut[]>(ctx, `/checkout/orders${qs({ limit })}`);
}

export function getOrder(ctx: Ctx, id: number) {
	return apiFetch<OrderOut>(ctx, `/checkout/orders/${id}`);
}

// RMA — customer returns (list/detail/create/cancel).
export function getReturns(ctx: Ctx) {
	return apiFetch<ReturnOut[]>(ctx, '/checkout/returns');
}

export function getReturn(ctx: Ctx, id: number) {
	return apiFetch<ReturnOut>(ctx, `/checkout/returns/${id}`);
}

export function createReturnRequest(
	ctx: Ctx,
	orderId: number,
	payload: { lines: { order_line_id: number; qty: number; reason?: string }[]; note?: string }
) {
	return json<ReturnOut>(ctx, `/checkout/orders/${orderId}/returns`, 'POST', payload);
}

export function cancelReturn(ctx: Ctx, id: number) {
	return json<ReturnOut>(ctx, `/checkout/returns/${id}/cancel`, 'POST', {});
}

// Dovanų kortelės — stored-value (checkout payment_method=gift_card).
export function getGiftCards(ctx: Ctx) {
	return apiFetch<GiftCardOut[]>(ctx, '/giftcards/mine');
}

export function checkGiftCard(ctx: Ctx, code: string) {
	return json<GiftCardOut>(ctx, '/giftcards/check', 'POST', { code });
}

export function redeemGiftCard(ctx: Ctx, code: string) {
	return json<GiftCardOut>(ctx, '/giftcards/redeem', 'POST', { code });
}

// Naujienlaiškis — public subscribe + authed preference.
export function subscribeNewsletter(ctx: Ctx, email: string, source = 'footer') {
	return json<NewsletterStatusOut>(ctx, '/newsletter/subscribe', 'POST', { email, source });
}

export function getNewsletterStatus(ctx: Ctx) {
	return apiFetch<NewsletterStatusOut>(ctx, '/newsletter/status');
}

export function setNewsletterPreference(ctx: Ctx, subscribed: boolean) {
	return json<NewsletterStatusOut>(ctx, '/newsletter/preference', 'PUT', { subscribed });
}

// CMS help-centras + parduotuvės.
export function getCmsCategories(ctx: Ctx) {
	return apiFetch<CmsCategoryOut[]>(ctx, '/cms/categories');
}

export function getCmsCategoryPages(ctx: Ctx, slug: string) {
	return apiFetch<CmsPageListOut[]>(ctx, `/cms/categories/${encodeURIComponent(slug)}/pages`);
}

export function getStores(ctx: Ctx) {
	return apiFetch<StoreLocationOut[]>(ctx, '/cms/stores');
}

// Header/promo/mega-meniu struktūra iš BE (cms Menu + MenuItem medis).
export function getNavigation(ctx: Ctx) {
	return apiFetch<NavigationOut>(ctx, '/cms/navigation');
}

// Viešas order-confirmation lookup: Montonio order-token arba authed order_id.
export function lookupOrder(
	ctx: Ctx,
	params: { order_token?: string; order_id?: number; session_uuid?: string }
) {
	return apiFetch<OrderOut>(
		ctx,
		`/checkout/orders/lookup${qs({
			order_token: params.order_token || undefined,
			order_id: params.order_id || undefined,
			session_uuid: params.session_uuid || undefined
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
