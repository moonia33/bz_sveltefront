<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Heart } from '@lucide/svelte';
	import { formatMoney } from '#lib/money';
	import type { ProductListOut } from '#lib/api/types';

	let { product, priority = false }: { product: ProductListOut; priority?: boolean } = $props();

	const img = $derived(product.images?.[0]);
	const href = $derived(`/p/${product.slug}`);
	const srcset = (s?: { url: string; width: number }[]) =>
		s?.map((i) => `${i.url} ${i.width}w`).join(', ') ?? '';

	// Heart būsena iš layout'o (serveris nuskaito /favorites/ids).
	const isFav = $derived(
		((page.data.favorite_product_ids as number[] | undefined) ?? []).includes(product.id)
	);
	let favBusy = $state(false);

	async function toggleFav() {
		if (favBusy) return;
		favBusy = true;
		try {
			const res = await fetch(
				isFav
					? `/api/v1/checkout/favorites/product/${product.id}`
					: '/api/v1/checkout/favorites',
				{
					method: isFav ? 'DELETE' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: isFav ? undefined : JSON.stringify({ product_id: product.id })
				}
			);
			if (res.ok) await invalidateAll();
		} finally {
			favBusy = false;
		}
	}
</script>

<div class="group relative">
	<div class="relative">
		<a class="block rounded-xl focus:outline-hidden" {href} tabindex="-1" aria-hidden="true">
			{#if img}
				<picture>
					{#if img.avif_srcset?.length}<source srcset={srcset(img.avif_srcset)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" type="image/avif" />{:else if img.avif_url}<source srcset={img.avif_url} type="image/avif" />{/if}
					{#if img.webp_srcset?.length}<source srcset={srcset(img.webp_srcset)} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" type="image/webp" />{:else if img.webp_url}<source srcset={img.webp_url} type="image/webp" />{/if}
					<img
						src={img.url}
						alt={img.alt_text || product.name}
						width="560"
						height="560"
						decoding="async"
						loading={priority ? 'eager' : 'lazy'}
						fetchpriority={priority ? 'high' : 'auto'}
						class="aspect-square w-full rounded-xl bg-surface object-cover"
					/>
				</picture>
			{:else}
				<div
					class="flex aspect-square w-full items-center justify-center rounded-xl bg-surface text-muted-foreground"
				>
					<svg class="size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
						/>
					</svg>
				</div>
			{/if}
		</a>

		<!-- Mėgstamų toggle (produkto lygmuo — default variantas sprendžiamas BE) -->
		<div class="absolute top-0 inset-e-0 z-10 pt-2 pe-2">
			<button
				type="button"
				onclick={toggleFav}
				disabled={favBusy}
				aria-pressed={isFav}
				title={isFav ? 'Pašalinti iš mėgstamų' : 'Į mėgstamas'}
				class="size-6 flex justify-center items-center gap-x-1 rounded-full text-xs bg-layer text-layer-foreground hover:bg-layer-hover disabled:opacity-50 disabled:pointer-events-none"
			>
				<Heart class="shrink-0 size-3.5 {isFav ? 'fill-current text-destructive' : ''}" />
				<span class="sr-only">Mėgstamiausi</span>
			</button>
		</div>

		{#if product.has_video}
			<div class="absolute top-9 end-2 pointer-events-none" title="Video">
				<span
					class="size-7 inline-flex items-center justify-center rounded-lg bg-[#FF0000] text-white shadow-sm"
				>
					<svg class="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M8 5.5v13l11-6.5z" />
					</svg>
					<span class="sr-only">Video</span>
				</span>
			</div>
		{/if}

		{#if product.discount_percent || product.labels?.length}
			<div class="absolute top-0 inset-s-0 pt-2 ps-2 pointer-events-none">
				<div class="flex flex-col items-start gap-y-1">
					{#if product.labels?.includes('new')}
						<p>
							<span
								class="py-0.5 px-2 inline-flex items-center gap-x-1.5 text-xs font-medium bg-primary-100 text-primary-800 rounded-full dark:bg-primary-600 dark:text-white"
							>
								Nauja
							</span>
						</p>
					{/if}
					{#if product.discount_percent}
						<p>
							<span
								class="py-1 ps-1.5 pe-2 bg-layer font-medium text-xs text-layer-foreground rounded-full shadow-2xs"
							>
								-{product.discount_percent}%
							</span>
						</p>
					{/if}

				</div>
			</div>
		{/if}
	</div>

	<a class="after:z-1 after:absolute after:inset-0" {href} aria-label={product.name}></a>

	<div class="pt-3">
		{#if product.brand}
			<p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{product.brand.name}
			</p>
		{/if}
		<a {href} class="block text-sm md:text-base text-foreground line-clamp-2">{product.name}</a>
		{#if product.category}
			<p class="mt-2 text-sm text-muted-foreground-1">{product.category.name}</p>
		{/if}

		<p class="mt-1 text-sm">
			{#if product.compare_at_price}
				<span class="text-sm text-muted-foreground-1">
					<s>{formatMoney(product.compare_at_price)}</s>
				</span>
				<span class="text-sm text-destructive">
					{product.price_to ? `nuo ${formatMoney(product.price)}` : formatMoney(product.price)}
				</span>
			{:else}
				<span class="font-medium text-sm text-foreground">
					{product.price_to ? `nuo ${formatMoney(product.price)}` : formatMoney(product.price)}
				</span>
			{/if}
		</p>
	</div>
</div>
