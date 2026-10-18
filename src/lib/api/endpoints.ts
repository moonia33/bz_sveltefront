import { apiFetch, qs, type ApiError } from './client';
import type {
	CartOut,
	CatalogFacetsOut,
	CategoryOut,
	MeOut,
	OrderOut,
	Paginated,
	ProductDetailOut,
	ProductListOut
} from './types';

type Ctx = Parameters<typeof apiFetch>[0];

export interface ProductListParams {
	q?: string;
	category_slug?: string;
	brand_slug?: string;
	group_code?: string;
	feature?: string;
	option?: string;
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

export function getProductFacets(ctx: Ctx, p: Omit<ProductListParams, 'page' | 'page_size' | 'sort'>) {
	return apiFetch<CatalogFacetsOut>(ctx, `/catalog/products/facets${qs({ ...p })}`);
}

export function getCategories(ctx: Ctx) {
	return apiFetch<CategoryOut[]>(ctx, '/catalog/categories');
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

export function getMe(ctx: Ctx) {
	return apiFetch<MeOut>(ctx, '/auth/me');
}

export function getOrders(ctx: Ctx, limit = 20) {
	return apiFetch<OrderOut[]>(ctx, `/checkout/orders${qs({ limit })}`);
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

export type { ApiError };
