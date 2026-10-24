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
	/** Originalo matmenys (0 = nežinoma → FE išmatuoja prieš atidarymą). */
	full_width: number;
	full_height: number;
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

/** Lengvas autocomplete įrašas iš /catalog/suggest — name_html/sku_html
 *  turi <mark> žymes (saugus HTML, generuoja BE). */
export interface SuggestItemOut {
	id: number;
	slug: string;
	name: string;
	name_html: string;
	sku: string;
	sku_html: string;
	brand_name: string;
	image_url: string | null;
	price: MoneyOut | null;
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
	// Skaitmeninė dovanų kortelė — PDP rodo el. pašto pristatymo
	// pastabą vietoj sandėlio likučių/ETA.
	is_gift_card: boolean;
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
	// Skaitmeninė dovanų kortelė — nereikalauja pristatymo.
	is_gift_card: boolean;
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
	company: string;
	company_reg_no: string;
	company_vat_no: string;
	line1: string;
	city: string;
	postal_code: string;
	country_code: string;
	phone: string;
	is_default_shipping: boolean;
	is_default_billing: boolean;
}

export interface ConsentOut {
	key: string;
	name: string;
	version: string | null;
	required: boolean;
	accepted: boolean;
	accepted_at: string | null;
	revoked_at: string | null;
}

export interface PhoneOut {
	phone: string;
	label: string;
	is_primary: boolean;
	is_verified: boolean;
}

export interface CustomerGroupOut {
	code: string;
	name: string;
	priority: number;
	pricing_type: string;
	allow_additional_discounts: boolean;
	allow_coupons: boolean;
}

export interface PickupPointOut {
	shipping_method_code: string;
	pickup_point_id: string;
	pickup_point_name: string;
	pickup_point_raw: Record<string, unknown>;
	country_code: string;
	shipping_method_image_url: string;
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
		inbank_product_code?: string;
		calculator_url?: string;
		min_amount?: number;
		max_amount?: number;
		min_period?: number;
		max_period?: number;
		allowed_periods?: number[];
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
	// Visas krepšelis skaitmeninis → shipping žingsnis slėpiamas.
	is_digital: boolean;
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
	sku: string;
	name: string;
	qty: number;
	unit_price: MoneyOut;
	compare_at_unit_price: MoneyOut | null;
	discount_percent: number | null;
	line_total: MoneyOut;
	compare_at_line_total: MoneyOut | null;
	delivery_window: DeliveryWindowOut | null;
	// RMA: ar eilutė grąžinama, langas (d.) ir jau grąžintas kiekis.
	returnable: boolean;
	return_days: number;
	returned_qty: number;
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
	// Split tender: padengta dovanų kortele / liko provider'iui.
	gift_card_amount: string;
	provider_amount: string;
	items: OrderLineOut[];
	delivery_window: DeliveryWindowOut | null;
	items_total: MoneyOut;
	discount_total: MoneyOut;
	shipping_total: MoneyOut;
	fees_total: MoneyOut;
	fees: FeeOut[];
	order_total: MoneyOut;
	created_at: string;
	supplier_reservation_status?: string;
	supplier_reservation_status_label?: string;
}

// RMA — customer-facing return request (checkout/api/returns.py).
export interface ReturnLineOut {
	id: number;
	order_line_id: number;
	sku: string;
	name: string;
	qty: number;
	received_qty: number;
	credited_qty: number;
	reason: string;
}

export interface ReturnOut {
	id: number;
	number: string;
	status: string;
	status_label: string;
	order_id: number;
	note: string;
	tracking_number: string;
	credit_invoice_number: string;
	created_at: string;
	decided_at: string;
	received_at: string;
	completed_at: string;
	lines: ReturnLineOut[];
}

// Dovanų kortelė — stored-value mokėjimo priemonė (ne nuolaidos kodas).
export interface GiftCardOut {
	code: string;
	currency: string;
	initial_amount: string;
	balance: string;
	status: string;
	expires_at: string | null;
	is_spendable: boolean;
}

export interface NewsletterStatusOut {
	subscribed: boolean;
	email: string;
}

// CMS help-centras / parduotuvės.
export interface CmsCategoryOut {
	slug: string;
	name: string;
	description: string;
	icon: string;
	page_count: number;
}

export interface CmsPageListOut {
	slug: string;
	title: string;
	updated_at: string;
}

export interface StoreLocationOut {
	id: number;
	name: string;
	line1: string;
	city: string;
	postal_code: string;
	country_code: string;
	phone: string;
	email: string;
	latitude: string | null;
	longitude: string | null;
	opening_hours: Record<string, string>;
	services: string[];
	description: string;
	is_pickup_point: boolean;
}

export interface NavItemOut {
	id: number;
	kind: string;
	label: string;
	url: string;
	icon: string;
	badge: string;
	highlight: boolean;
	new_tab: boolean;
	show_in: string;
	children: NavItemOut[];
}

export interface MegaMenuFeatureOut {
	title: string;
	text: string;
	image_url: string;
	url: string;
	cta_label: string;
}

export interface NavigationOut {
	promo: NavItemOut | null;
	items: NavItemOut[];
	footers: NavItemOut[];
	bottom_links: NavItemOut[];
	mega_features: Record<string, MegaMenuFeatureOut>;
}
