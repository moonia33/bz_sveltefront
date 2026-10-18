<script lang="ts">
	import { goto } from '$app/navigation';
	import FilterSidebar from '#lib/components/shop/FilterSidebar.svelte';
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import { ChevronDown, Loader2 } from '@lucide/svelte';
	import type { CatalogFacetsOut, Paginated, ProductListOut } from '#lib/api/types';
	import { onDestroy, onMount } from 'svelte';

	let {
		title,
		products,
		facets,
		params
	}: {
		title: string;
		products: Paginated<ProductListOut>;
		facets: CatalogFacetsOut;
		params: URLSearchParams;
	} = $props();

	const pageSize = 20;

	let items = $state<ProductListOut[]>([]);
	let total = $state(0);
	let currentPage = $state(1);
	let loadingMore = $state(false);
	let loadError = $state<string | null>(null);
	let sentinel = $state<HTMLDivElement | null>(null);
	let observer: IntersectionObserver | null = null;

	// Reset kai load() duoda naują puslapio rezultatą (filtrų/paieškos pasikeitimas).
	$effect(() => {
		items = products.items ?? [];
		total = products.count ?? 0;
		currentPage = Math.max(1, Number(params.get('page') ?? 1) || 1);
		loadError = null;
	});

	const hasMore = $derived(items.length < total);
	const currentSort = $derived(params.get('sort') ?? '');

	function href(patch: Record<string, string | null>): string {
		const p = new URLSearchParams(params);
		p.delete('page');
		for (const [k, v] of Object.entries(patch)) {
			if (v === null || v === '') p.delete(k);
			else p.set(k, v);
		}
		return `?${p.toString()}`;
	}

	async function loadMore() {
		if (loadingMore || !hasMore) return;
		loadingMore = true;
		loadError = null;
		try {
			const p = new URLSearchParams(params);
			p.set('page', String(currentPage + 1));
			const res = await fetch(`/api/v1/catalog/products?${p.toString()}`, {
				credentials: 'include',
				headers: { Accept: 'application/json' }
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as Paginated<ProductListOut>;
			const seen = new Set(items.map((i) => i.id));
			items = [...items, ...(data.items ?? []).filter((i) => !seen.has(i.id))];
			total = data.count ?? total;
			currentPage += 1;
		} catch {
			loadError = 'Nepavyko užkrauti daugiau prekių.';
		} finally {
			loadingMore = false;
		}
	}

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) loadMore();
			},
			{ rootMargin: '600px 0px' }
		);
		if (sentinel) observer.observe(sentinel);
	});

	$effect(() => {
		if (!observer || !sentinel) return;
		observer.disconnect();
		observer.observe(sentinel);
	});

	onDestroy(() => observer?.disconnect());
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<nav class="mb-4 text-sm text-gray-500 dark:text-neutral-400" aria-label="Duonos traiškanys">
		<a href="/" class="hover:text-gray-800 dark:hover:text-neutral-200">Pradžia</a>
		<span class="mx-1">/</span>
		<span class="text-gray-800 dark:text-neutral-200">{title}</span>
	</nav>

	<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>

	<div class="flex flex-col gap-8 lg:flex-row">
		<FilterSidebar {facets} {params} />

		<div class="min-w-0 grow">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<p class="text-sm text-gray-500 dark:text-neutral-400">
					{total} prekė(-ių)
					{#if params.get('q')}
						— „{params.get('q')}“
					{/if}
				</p>
				<div class="relative">
					<select
						class="appearance-none rounded-lg border-gray-200 py-2 pe-9 ps-3 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
						aria-label="Rūšiavimas"
						onchange={(e) => {
							const v = (e.target as HTMLSelectElement).value;
							goto(href({ sort: v || null }));
						}}
					>
						<option value="" selected={!currentSort}>Rekomenduojama</option>
						<option value="price" selected={currentSort === 'price'}>Kaina: nuo mažiausios</option>
						<option value="-price" selected={currentSort === '-price'}>Kaina: nuo didžiausios</option>
						<option value="-created" selected={currentSort === '-created'}>Naujausios</option>
						<option value="name" selected={currentSort === 'name'}>Pavadinimas A–Ž</option>
					</select>
					<ChevronDown
						class="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
					/>
				</div>
			</div>

			{#if items.length}
				<ProductGrid products={items} />
			{:else}
				<div
					class="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-neutral-700"
				>
					<p class="text-gray-500 dark:text-neutral-400">Prekių nerasta.</p>
				</div>
			{/if}

			<!-- Infinite scroll sentinel + manual fallback -->
			{#if hasMore}
				<div bind:this={sentinel} class="mt-8 flex justify-center">
					<button
						type="button"
						onclick={loadMore}
						disabled={loadingMore}
						class="inline-flex items-center gap-x-2 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
					>
						{#if loadingMore}
							<Loader2 class="size-4 animate-spin" /> Kraunama…
						{:else}
							Rodyti daugiau
						{/if}
					</button>
				</div>
			{/if}
			{#if loadingMore}
				<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{#each Array.from({ length: 4 }) as _, i (i)}
						<div class="animate-pulse">
							<div class="aspect-square rounded-xl bg-gray-100 dark:bg-neutral-800"></div>
							<div class="mt-3 h-4 w-3/4 rounded bg-gray-100 dark:bg-neutral-800"></div>
							<div class="mt-2 h-4 w-1/3 rounded bg-gray-100 dark:bg-neutral-800"></div>
						</div>
					{/each}
				</div>
			{/if}
			{#if loadError}
				<p class="mt-4 text-center text-sm text-zvynas-600">{loadError}</p>
			{/if}
		</div>
	</div>
</div>
