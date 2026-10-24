<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { ProductListOut } from '#lib/api/types';
	import ProductCard from '#lib/components/shop/ProductCard.svelte';

	let {
		products,
		title,
		href
	}: {
		products: ProductListOut[];
		title?: string;
		href?: string;
	} = $props();

	let scroller = $state<HTMLDivElement | null>(null);
	let canPrev = $state(false);
	let canNext = $state(false);

	function updateArrows() {
		if (!scroller) return;
		canPrev = scroller.scrollLeft > 1;
		canNext = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
	}

	function scroll(dir: 1 | -1) {
		scroller?.scrollBy({ left: dir * scroller.clientWidth, behavior: 'smooth' });
	}

	$effect(() => {
		if (!scroller) return;
		updateArrows();
		const ro = new ResizeObserver(updateArrows);
		ro.observe(scroller);
		return () => ro.disconnect();
	});
</script>

{#if products.length}
	<section>
		{#if title || href}
			<div class="mb-4 flex items-end justify-between gap-x-4">
				{#if title}
					<h2 class="font-medium text-xl text-foreground">{title}</h2>
				{/if}
				{#if href}
					<a
						class="inline-flex shrink-0 items-center gap-x-1.5 text-sm text-foreground underline underline-offset-4 hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
						{href}
					>
						Žiūrėti visas
						<ChevronRight class="shrink-0 size-4" />
					</a>
				{/if}
			</div>
		{/if}

		<div class="relative">
			<div
				bind:this={scroller}
				onscroll={updateArrows}
				class="flex snap-x snap-mandatory gap-x-3 overflow-x-auto sm:gap-x-5 scrollbar-none"
			>
				{#each products as product (product.id)}
					<div
						class="w-[calc(50%-0.5rem)] shrink-0 snap-start sm:w-[calc(33.333%-0.85rem)] lg:w-[calc(25%-0.95rem)]"
					>
						<ProductCard {product} />
					</div>
				{/each}
			</div>

			<button
				type="button"
				disabled={!canPrev}
				onclick={() => scroll(-1)}
				aria-label="Ankstesnės"
				class="absolute top-1/2 inset-s-2 inline-flex -translate-y-1/2 justify-center items-center size-9.5 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:cursor-default"
			>
				<ChevronLeft class="shrink-0 size-5" />
			</button>
			<button
				type="button"
				disabled={!canNext}
				onclick={() => scroll(1)}
				aria-label="Kitos"
				class="absolute top-1/2 inset-e-2 inline-flex -translate-y-1/2 justify-center items-center size-9.5 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:cursor-default"
			>
				<ChevronRight class="shrink-0 size-5" />
			</button>
		</div>
	</section>
{/if}
