<script lang="ts">
	import type { ProductListOut } from '#lib/api/types';
	import ProductCard from './ProductCard.svelte';

	let {
		products,
		priorityFirst = false
	}: {
		products: ProductListOut[];
		priorityFirst?: boolean;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-y-10 gap-x-4 md:grid-cols-3 xl:grid-cols-4">
	{#each products as product, i (product.id)}
		<ProductCard {product} priority={priorityFirst && i < 4} />
	{/each}
</div>
