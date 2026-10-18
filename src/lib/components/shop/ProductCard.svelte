<script lang="ts">
	import { formatMoney } from '#lib/money';
	import type { ProductListOut } from '#lib/api/types';

	let { product }: { product: ProductListOut } = $props();

	const img = $derived(product.images?.[0]);
</script>

<a
	href="/p/{product.slug}"
	class="group flex flex-col rounded-xl border border-gray-200 bg-white transition hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
>
	<div class="relative overflow-hidden rounded-t-xl">
		{#if img}
			<picture>
				{#if img.avif_url}<source srcset={img.avif_url} type="image/avif" />{/if}
				{#if img.webp_url}<source srcset={img.webp_url} type="image/webp" />{/if}
				<img
					src={img.url}
					alt={img.alt_text || product.name}
					width="400"
					height="400"
					loading="lazy"
					class="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
				/>
			</picture>
		{:else}
			<div
				class="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-300 dark:bg-neutral-800 dark:text-neutral-600"
			>
				<svg class="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
					/>
				</svg>
			</div>
		{/if}
		{#if product.discount_percent}
			<span
				class="absolute start-2 top-2 rounded-md bg-zvynas-600 px-1.5 py-0.5 text-xs font-semibold text-white"
				>-{product.discount_percent}%</span
			>
		{/if}
	</div>
	<div class="flex grow flex-col gap-y-1 p-4">
		{#if product.brand}
			<span class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400"
				>{product.brand.name}</span
			>
		{/if}
		<h3 class="line-clamp-2 text-sm font-medium text-gray-800 dark:text-neutral-200">
			{product.name}
		</h3>
		<div class="mt-auto flex items-baseline gap-x-2 pt-2">
			<span class="text-base font-semibold text-gray-900 dark:text-white"
				>{formatMoney(product.price)}</span
			>
			{#if product.price_to}
				<span class="text-sm text-gray-500 dark:text-neutral-400"
					>– {formatMoney(product.price_to)}</span
				>
			{/if}
			{#if product.compare_at_price}
				<span class="text-sm text-gray-400 line-through dark:text-neutral-500"
					>{formatMoney(product.compare_at_price)}</span
				>
			{/if}
		</div>
	</div>
</a>
