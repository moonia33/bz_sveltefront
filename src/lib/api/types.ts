// Backend DTOs — mirror of django_ecommerce Ninja schemas.
// Source of truth: catalog/api_schemas.py, checkout/schemas.py.

export interface MoneyOut {
	currency: string;
	net: number;
	vat_rate: number;
	vat: number;
	gross: number;
}

export interface BrandRefOut {
	id: number;
	slug: string;
	name: string;
}

export interface CategoryRefOut {
	id: number;
	slug: string;
	name: string;
}

export interface ProductImageOut {
	avif_url: string | null;
	webp_url: string | null;
	url: string;
	alt_text: string;
	sort_order: number;
}

export interface ProductListOut {
	id: number;
	sku: string;
	slug: string;
	name: string;
	is_active: boolean;
	product_group_code: string;
	brand: BrandRefOut | null;
	category: CategoryRefOut | null;
	images: ProductImageOut[];
	price: MoneyOut;
	price_to: MoneyOut | null;
	compare_at_price: MoneyOut | null;
	discount_percent: number | null;
}

export interface Paginated<T> {
	items: T[];
	count: number;
}

export interface CategoryOut {
	id: number;
	slug: string;
	name: string;
	parent_id: number | null;
	description: string;
	hero_image_url: string | null;
	menu_icon_url: string | null;
	seo_title: string;
	seo_description: string;
	seo_keywords: string;
}

export interface BrandOut {
	id: number;
	slug: string;
	name: string;
}

export interface FeatureValueOut {
	id: number;
	value: string;
	label: string | null;
}

export interface FeatureOut {
	id: number;
	code: string;
	name: string;
	values: FeatureValueOut[];
}

export interface OptionValueOut {
	id: number;
	code: string;
	label: string;
}

export interface OptionTypeOut {
	id: number;
	code: string;
	name?: string;
}

export interface ProductGroupOut {
	id: number;
	code: string;
	name: string;
	description: string;
}

export interface CatalogFacetsOut {
	categories: CategoryOut[];
	brands: BrandOut[];
	product_groups: ProductGroupOut[];
	features: FeatureOut[];
	option_types: OptionTypeOut[];
}

export interface VariantOptionOut {
	option_type_code: string;
	option_type_name: string;
	option_value_code: string;
	option_value_label: string;
}

export interface VariantOut {
	id: number;
	sku: string;
	barcode: string | null;
	product_group_code: string;
	name: string;
	is_active: boolean;
	stock_available: number;
	price: MoneyOut;
	compare_at_price: MoneyOut | null;
	offer_id: number | null;
	offer_label: string;
	condition_grade: string;
	offer_visibility: string;
	discount_percent: number | null;
	options: VariantOptionOut[];
	images: ProductImageOut[];
}

export interface DeliveryWindowOut {
	min_date: string;
	max_date: string;
	kind: string;
	rule_code: string;
	source: string;
}

export interface ProductFeatureOut {
	feature_id: number;
	feature_code: string;
	feature_name: string;
	value_id: number;
	value: string;
	value_label: string | null;
}

export interface ProductVideoOut {
	url: string;
	video_type: string;
	language_code: string;
	sort_order: number;
}

export interface ContentBlockOut {
	key: string;
	title: string;
	placement: string;
	type: string;
	payload: Record<string, unknown>;
}

export interface ProductDetailOut {
	id: number;
	sku: string;
	slug: string;
	name: string;
	description: string;
	is_active: boolean;
	product_group_code: string;
	seo_title: string;
	seo_description: string;
	seo_keywords: string;
	brand: BrandRefOut | null;
	category: CategoryRefOut | null;
	images: ProductImageOut[];
	videos: ProductVideoOut[];
	features: ProductFeatureOut[];
	delivery_window: DeliveryWindowOut | null;
	content_blocks: ContentBlockOut[];
	variants: VariantOut[];
}

export interface CartItemOut {
	id: number;
	variant_id: number;
	offer_id: number | null;
	sku: string;
	name: string;
	qty: number;
	stock_available: number;
	unit_price: MoneyOut;
	compare_at_price: MoneyOut | null;
	discount_percent: number | null;
	line_total: MoneyOut;
	delivery_window: DeliveryWindowOut | null;
}

export interface CartOut {
	currency: string;
	country_code: string;
	items: CartItemOut[];
	items_total: MoneyOut;
	delivery_window: DeliveryWindowOut | null;
}
