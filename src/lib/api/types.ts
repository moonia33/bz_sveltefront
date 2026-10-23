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
	/** PDP brand sekcijai; null jei brand'as neturi logo. */
	logo_url?: string | null;
	/** 256px webp thumb (fallback — logo_url). */
	logo_thumb_url?: string | null;
}

export interface CategoryRefOut {
	id: number;
	slug: string;
	name: string;
}

export interface ImageSourceOut {
	url: string;
	width: number;
}

export interface ProductImageOut {
	avif_url: string | null;
	webp_url: string | null;
	url: string;
	alt_text: string;
	sort_order: number;
	/** srcset rinkiniai: listing → sq300/sq600; PDP → m300/d800. */
	avif_srcset: ImageSourceOut[];
	webp_srcset: ImageSourceOut[];
	/** Originalas — PDP zoom/lightbox. */
	full_url: string | null;
}

export interface ProductListOut {
	id: number;
	sku: string;
	slug: string;
	name: string;
	is_active: boolean;
	is_part: boolean;
	product_group_code: string;
	brand: BrandRefOut | null;
	category: CategoryRefOut | null;
	images: ProductImageOut[];
	price: MoneyOut;
	price_to: MoneyOut | null;
	compare_at_price: MoneyOut | null;
	discount_percent: number | null;
	has_video?: boolean;
	labels?: string[];
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
	list_template: 'grid' | 'list';
	description: string;
	hero_image_url: string | null;
	menu_icon_url: string | null;
	seo_title: string;
	seo_description: string;
	seo_keywords: string;
}

export interface BrandCategoryOut {
	slug: string;
	name: string;
	product_count: number;
}

export interface BrandOut {
	id: number;
	slug: string;
	name: string;
	description?: string;
	logo_url?: string | null;
	logo_thumb_url?: string | null;
	logo_alt?: string;
	seo_title?: string;
	seo_description?: string;
	seo_keywords?: string;
	// Brand „shelf": kategorijos su brand'o prekių skaičiais (detail endpoint).
	categories?: BrandCategoryOut[];
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
	// 'checkbox' (default) renders values; 'range' renders a numeric
	// min/max input pair and carries min/max/unit instead of values (F4).
	widget?: 'checkbox' | 'range';
	min?: number | null;
	max?: number | null;
	unit?: string;
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
	display_type: string;
	swatch_type: string | null;
	// Same facet widget contract as FeatureOut (F4).
	widget?: 'checkbox' | 'range';
	min?: number | null;
	max?: number | null;
	unit?: string;
	values: OptionValueOut[];
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

// Per-warehouse split pagal Warehouse.kind (local/remote) — PDP variantui.
export interface StockLineOut {
	qty: number;
	delivery_window: DeliveryWindowOut | null;
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
	// Trade-pack info (manufacturer data, same for all suppliers)
	sold_as_pack: boolean;
	pack_quantity: number;
	trade_pack_qty: number;
	pack_unit: string;
	pack_barcode: string;
	pack_price: MoneyOut | null;
	options: VariantOptionOut[];
	// Variant-level features (override product features with the same feature_code)
	features: ProductFeatureOut[];
	images: ProductImageOut[];
	// Per-warehouse stock split pagal Warehouse.kind (local/remote)
	stock_local?: StockLineOut | null;
	stock_remote?: StockLineOut | null;
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

export interface CmsContentBlockOut {
	type: string;
	payload: Record<string, unknown>;
}

export interface CmsPageOut {
	slug: string;
	title: string;
	seo_title: string;
	seo_description: string;
	content_blocks: CmsContentBlockOut[];
}

export interface CartItemOptionOut {
	option_type_code: string;
	option_type_name: string;
	option_value_code: string;
	option_value_label: string;
}

export interface CartItemOut {
	id: number;
	variant_id: number;
	offer_id: number | null;
	sku: string;
	name: string;
	product_slug: string;
	variant_name: string;
	options: CartItemOptionOut[];
	image: ProductImageOut | null;
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

export interface AddressOut {
	id: number;
	label: string;
	full_name: string;
	line1: string;
	line2: string;
	city: string;
	postal_code: string;
	country_code: string;
	is_default_shipping: boolean;
	is_default_billing: boolean;
}

export interface ConsentOut {
	code: string;
	required: boolean;
	granted: boolean;
	version: string;
}

export interface PhoneOut {
	id: number;
	e164: string;
	is_primary: boolean;
}

export interface CustomerGroupOut {
	id: number;
	code: string;
	name: string;
}

export interface PickupPointOut {
	carrier: string;
	pickup_point_id: string;
	name: string;
	address: string;
	city: string;
	postal_code: string;
	country_code: string;
}

export interface MeOut {
	email: string;
	first_name: string;
	last_name: string;
	customer_groups: CustomerGroupOut[];
	primary_customer_group: CustomerGroupOut | null;
	consents: ConsentOut[];
	phones: PhoneOut[];
	addresses: AddressOut[];
	primary_pickup_point: PickupPointOut | null;
}

// Mėgstamos (wishlist): GET/POST/DELETE /checkout/favorites (guest session palaikoma).
export interface FavoriteVariantOut {
	id: number;
	label: string;
	sku: string;
	in_stock: boolean;
}

export interface FavoriteItemOut {
	favorite_id: number;
	variant_id: number;
	product: ProductListOut;
	variants: FavoriteVariantOut[];
}

export interface FavoritesOut {
	items: FavoriteItemOut[];
	variant_ids: number[];
	count: number;
}

// Viešas PDP pristatymo metodas: GET /shipping/methods (be auth).
export interface ShippingMethodOut {
	code: string;
	name: string;
	carrier_code: string;
	requires_pickup_point: boolean;
	price: MoneyOut;
}

// Paštomatai: GET /dpd/lockers, GET /unisend/terminals.
export interface PickupPointLocation {
	id: string;
	name: string;
	city: string;
	street: string;
	postalCode: string;
	countryCode: string;
	latitude: number | null;
	longitude: number | null;
}

// Checkout (auth reikalingas — OTP sessija).
export interface ConsentDefinitionOut {
	kind: string;
	name: string;
	document_version: string;
	required: boolean;
	url: string;
}

export interface PaymentMethodOut {
	code: string;
	name: string;
	kind: string;
	provider: string;
	instructions: string;
	logo_url: string;
}

export interface PaymentOptionOut {
	id: string;
	kind: string;
	title: string;
	provider: string;
	instructions: string;
	logo_url: string;
	payload: {
		payment_method: string;
		montonio_method?: string;
		preferred_provider?: string;
		calculator_url?: string;
	};
}

export interface FeeOut {
	code: string;
	name: string;
	amount: MoneyOut;
}

export interface CheckoutPreviewOut {
	currency: string;
	country_code: string;
	shipping_method: string;
	items: CartItemOut[];
	delivery_window: DeliveryWindowOut | null;
	items_total: MoneyOut;
	discount_total: MoneyOut;
	shipping_total: MoneyOut;
	fees_total: MoneyOut;
	fees: FeeOut[];
	order_total: MoneyOut;
}

export interface CheckoutConfirmOut {
	order_id: number;
	payment_provider: string;
	payment_status: string;
	redirect_url: string;
	payment_instructions: string;
}

export interface OrderLineOut {
	id: number;
	product_id: number | null;
	variant_id: number | null;
	sku: string;
	name: string;
	qty: number;
	unit_price: MoneyOut;
	line_total: MoneyOut;
}

export interface FeeOut {
	code: string;
	name: string;
	amount: MoneyOut;
}

export interface OrderOut {
	id: number;
	status: string;
	status_label: string;
	delivery_status: string;
	delivery_status_label: string;
	fulfillment_mode: string;
	fulfillment_mode_label: string;
	currency: string;
	country_code: string;
	shipping_method: string;
	carrier_code: string;
	tracking_number: string;
	delivered_at: string;
	invoice_number: string;
	payment_provider: string;
	payment_provider_label: string;
	payment_status: string;
	payment_status_label: string;
	payment_redirect_url: string;
	payment_instructions: string;
	items: OrderLineOut[];
	delivery_window: DeliveryWindowOut | null;
	items_total: MoneyOut;
	discount_total: MoneyOut;
	shipping_total: MoneyOut;
	fees_total: MoneyOut;
	fees: FeeOut[];
	order_total: MoneyOut;
	created_at: string;
}
