<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { ProductListOut } from '#lib/api/types';
	import ProductCard from '#lib/components/shop/ProductCard.svelte';
	import {
		hasAnalyticsConsent,
		trackRecClick,
		trackRecImpression,
		type RecContext
	} from '#lib/recTracking';
	import { untrack } from 'svelte';

	let {
		products,
		title,
		href,
		rec
	}: {
		products: ProductListOut[];
		title?: string;
		href?: string;
		/** Rekomendacijų sąrašas: impression (kai matomas) ir click metrikos BE. */
		rec?: RecContext;
	} = $props();

	let section = $state<HTMLElement | null>(null);

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

	// Vienas impression per sąrašą, kai bent pusė bloko matoma. Raktas – seed + prekių ID:
	// tas pats sąrašas po invalidateAll (pvz. mėgstamų) neskaičiuojamas iš naujo.
	const recKey = $derived(rec ? `${rec.seed ?? ''}|${products.map((p) => p.id).join(',')}` : '');

	$effect(() => {
		const key = recKey;
		if (!key || !section) return;
		const ctx = untrack(() => ({ ...rec! }));
		const ids = key.slice(key.indexOf('|') + 1).split(',').map(Number);
		const io = new IntersectionObserver(
			(entries) => {
				// Be sutikimo stebim toliau – sutikus, kitas matomumas bus užskaitytas.
				if (!entries.some((e) => e.intersectionRatio >= 0.5) || !hasAnalyticsConsent()) return;
				io.disconnect();
				trackRecImpression(ctx, ids);
			},
			{ threshold: 0.5 }
		);
		io.observe(section);
		return () => io.disconnect();
	});
</script>

{#if products.length}
	<section bind:this={section}>
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
				{#each products as product, i (product.id)}
					<div
						onclickcapture={(e) => {
							if (rec && (e.target as Element).closest('a')) trackRecClick(rec, product.id, i);
						}}
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
				class="absolute z-10 top-1/2 inset-s-2 inline-flex -translate-y-1/2 justify-center items-center size-9.5 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:cursor-default"
			>
				<ChevronLeft class="shrink-0 size-5" />
			</button>
			<button
				type="button"
				disabled={!canNext}
				onclick={() => scroll(1)}
				aria-label="Kitos"
				class="absolute z-10 top-1/2 inset-e-2 inline-flex -translate-y-1/2 justify-center items-center size-9.5 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus disabled:opacity-50 disabled:cursor-default"
			>
				<ChevronRight class="shrink-0 size-5" />
			</button>
		</div>
	</section>
{/if}
