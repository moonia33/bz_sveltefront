<script lang="ts">
	import { formatMoney } from '#lib/money';
	import type { ProductListOut } from '#lib/api/types';

	let { products }: { products: ProductListOut[] } = $props();
</script>

<ul class="divide-y divide-layer-line border-y border-layer-line">
	{#each products as product (product.id)}
		{@const img = product.images?.[0]}
		<li>
			<a
				href="/p/{product.slug}"
				class="group flex items-center gap-x-3 sm:gap-x-4 py-2.5 sm:py-3 rounded-lg focus:outline-hidden focus:bg-muted-focus"
			>
				<div class="shrink-0 size-14 sm:size-16 rounded-lg bg-surface overflow-hidden">
					{#if img}
						<picture>
							{#if img.avif_url}<source srcset={img.avif_url} type="image/avif" />{/if}
							{#if img.webp_url}<source srcset={img.webp_url} type="image/webp" />{/if}
							<img
								src={img.url}
								alt={img.alt_text || product.name}
								width="64"
								height="64"
								decoding="async"
								loading="lazy"
								class="size-full object-cover"
							/>
						</picture>
					{/if}
				</div>

				<div class="grow min-w-0">
					<p class="text-sm text-foreground group-hover:text-primary-hover line-clamp-2">
						{product.name}
					</p>
					{#if product.brand || product.sku}
						<p class="mt-0.5 text-xs text-muted-foreground-1 truncate">
							{[product.brand?.name, product.sku].filter(Boolean).join(' · ')}
						</p>
					{/if}
				</div>

				<div class="shrink-0 text-end">
					{#if product.discount_percent}
						<span
							class="inline-block py-0.5 px-1.5 bg-layer text-[11px] font-medium text-layer-foreground rounded-full shadow-2xs"
							>-{product.discount_percent}%</span
						>
					{/if}
					<p class="mt-0.5 text-sm">
						{#if product.compare_at_price}
							<span class="text-xs text-muted-foreground-1"
								><s>{formatMoney(product.compare_at_price)}</s></span
							>
							<span class="font-medium text-sm text-destructive">
								{product.price_to
									? `nuo ${formatMoney(product.price)}`
									: formatMoney(product.price)}
							</span>
						{:else}
							<span class="font-medium text-sm text-foreground">
								{product.price_to
									? `nuo ${formatMoney(product.price)}`
									: formatMoney(product.price)}
							</span>
						{/if}
					</p>
				</div>
			</a>
		</li>
	{/each}
</ul>
