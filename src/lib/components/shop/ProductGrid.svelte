<script lang="ts">
	import type { ProductListOut } from '#lib/api/types';
	import ProductCard from './ProductCard.svelte';

	let { products }: { products: ProductListOut[] } = $props();
</script>

<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
	{#each products as product (product.id)}
		<ProductCard {product} />
	{/each}
</div>
