import {
	getCart,
	getCategories,
	getFavoriteIds,
	getMeOrNull,
	getNavigation,
	getShopConfig
} from '#lib/api/endpoints';
import type { CategoryOut } from '#lib/api/types';
import type { LayoutServerLoad } from './$types';

// Layout'o kategorijų sąrašas serializuojamas į kiekvieną puslapį (ir dar kartą
// per `all`), todėl tekstiniai laukai tuštinami: meniu/breadcrumb/kortelėms jų
// nereikia, o kategorijos puslapis aprašymą ir SEO ima iš /catalog/categories/{slug}.
const slimCategory = (c: CategoryOut): CategoryOut => ({
	...c,
	description: '',
	seo_title: '',
	seo_description: '',
	seo_keywords: ''
});

export const load: LayoutServerLoad = async (event) => {
	const ctx = { fetch: event.fetch, request: event.request };
	const [categories, cart, me, favorites, navigation, shopConfig] = await Promise.all([
		getCategories(ctx).catch(() => []),
		getCart(ctx).catch(() => null),
		getMeOrNull(ctx),
		getFavoriteIds(ctx).catch(() => ({
			variant_ids: [] as number[],
			product_ids: [] as number[],
			count: 0
		})),
		getNavigation(ctx).catch(() => null),
		getShopConfig(ctx).catch(() => null)
	]);
	return {
		categories: categories.map(slimCategory),
		cart,
		me,
		favorite_count: favorites.count,
		favorite_product_ids: favorites.product_ids,
		navigation,
		shopConfig
	};
};
