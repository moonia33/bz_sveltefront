<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ChevronDown, ChevronRight, Loader2, SlidersHorizontal } from '@lucide/svelte';
	import FilterSidebar from '#lib/components/shop/FilterSidebar.svelte';
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import ProductList from '#lib/components/shop/ProductList.svelte';
	import { pluralLt } from '#lib/i18n';
	import type { CatalogFacetsOut, CategoryOut, Paginated, ProductListOut } from '#lib/api/types';
	import { onDestroy, onMount } from 'svelte';

	let {
		title,
		description,
		products,
		facets,
		params,
		pathname,
		breadcrumbs = [],
		categoryChips = [],
		categoryLinks = [],
		categorySlug,
		listTemplate = 'grid',
		pageSize = 20
	}: {
		title: string;
		description?: string;
		products: Paginated<ProductListOut>;
		facets: CatalogFacetsOut;
		params: URLSearchParams;
		pathname: string;
		breadcrumbs?: { name: string; href?: string }[];
		categoryChips?: CategoryOut[];
		categoryLinks?: { slug: string; name: string }[];
		categorySlug?: string;
		listTemplate?: 'grid' | 'list';
		pageSize?: number;
	} = $props();

	let items = $state<ProductListOut[]>(products.items ?? []);
	let total = $state(products.count ?? 0);
	let lastPage = $state(Math.max(1, Number(params.get('page') ?? 1) || 1));
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	let filtersOpen = $state(false);
	let sentinel = $state<HTMLDivElement | null>(null);
	let observer: IntersectionObserver | null = null;

	// Reset when load() returns a new result set (filters/sort/query changed).
	$effect(() => {
		items = products.items ?? [];
		total = products.count ?? 0;
		lastPage = Math.max(1, Number(params.get('page') ?? 1) || 1);
		loadError = null;
	});

	const hasMore = $derived(lastPage * pageSize < total);
	const currentSort = $derived(params.get('sort') ?? '');
	const currentPage = $derived(Math.max(1, Number(params.get('page') ?? 1) || 1));

	export function capture() {
		return { items: $state.snapshot(items), lastPage, total };
	}

	export function restore(v: { items: ProductListOut[]; lastPage: number; total: number } | undefined) {
		if (!v) return;
		items = v.items;
		lastPage = v.lastPage;
		total = v.total;
	}

	function href(patch: Record<string, string | null>): string {
		const p = new URLSearchParams(params);
		p.delete('page');
		for (const [k, v] of Object.entries(patch)) {
			if (v === null || v === '') p.delete(k);
			else p.set(k, v);
		}
		const s = p.toString();
		return `${pathname}${s ? `?${s}` : ''}`;
	}

	const nextHref = $derived.by(() => {
		const p = new URLSearchParams(params);
		p.set('page', String(lastPage + 1));
		return `${pathname}?${p.toString()}`;
	});

	const fromStartHref = $derived.by(() => {
		const p = new URLSearchParams(params);
		p.delete('page');
		const s = p.toString();
		return `${pathname}${s ? `?${s}` : ''}`;
	});

	async function loadMore() {
		if (loading || !hasMore || loadError) return;
		loading = true;
		loadError = null;
		try {
			const p = new URLSearchParams(params);
			p.set('page', String(lastPage + 1));
			if (categorySlug) p.set('category_slug', categorySlug);
			const res = await fetch(`/api/v1/catalog/products?${p.toString()}`, {
				credentials: 'include',
				headers: { Accept: 'application/json' }
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = (await res.json()) as Paginated<ProductListOut>;
			const seen = new Set(items.map((i) => i.id));
			items = [...items, ...(data.items ?? []).filter((i) => !seen.has(i.id))];
			total = data.count ?? total;
			lastPage += 1;
			// Reflect loaded depth in URL without re-running load().
			const up = new URLSearchParams(params);
			if (lastPage > 1) up.set('page', String(lastPage));
			else up.delete('page');
			const us = up.toString();
			await goto(`${pathname}${us ? `?${us}` : ''}`, {
				state: page.state,
				shallow: true,
				replace: true
			});
		} catch {
			loadError = 'Nepavyko užkrauti daugiau prekių.';
		} finally {
			loading = false;
		}
	}

	function retry() {
		loadError = null;
		loadMore();
	}

	onMount(() => {
		observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) loadMore();
			},
			{ rootMargin: '800px 0px' }
		);
		if (sentinel) observer.observe(sentinel);
	});

	$effect(() => {
		if (!observer || !sentinel) return;
		observer.disconnect();
		observer.observe(sentinel);
	});

	onDestroy(() => observer?.disconnect());

	const sorts: [string, string][] = [
		['', 'Rekomenduojama'],
		['best_selling', 'Populiariausios'],
		['price', 'Kaina: nuo mažiausios'],
		['-price', 'Kaina: nuo didžiausios'],
		['-created', 'Naujausios'],
		['discounted', 'Su nuolaida'],
		['name', 'Pavadinimas A–Ž']
	];
</script>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="lg:flex">
		<FilterSidebar {facets} {params} bind:open={filtersOpen} {categoryLinks} />

		<div class="grow min-w-0 pt-6 lg:pt-10 lg:ps-8">
			{#if breadcrumbs.length}
				<nav aria-label="Naršymo kelias" class="mb-4">
					<ol class="flex items-center gap-x-1.5 text-sm">
						{#each breadcrumbs as crumb, i (i)}
							<li class="flex items-center gap-x-1.5">
								{#if i > 0}<ChevronRight class="size-3.5 text-muted-foreground-2" />{/if}
								{#if crumb.href && i < breadcrumbs.length - 1}
									<a
										href={crumb.href}
										class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4"
										>{crumb.name}</a
									>
								{:else}
									<span class="text-foreground">{crumb.name}</span>
								{/if}
							</li>
						{/each}
					</ol>
				</nav>
			{/if}

			<div class="mb-4">
				<h1 class="font-medium text-xl text-foreground">{title}</h1>
				{#if description}
					<p class="mt-1 text-sm text-muted-foreground-1">{description}</p>
				{/if}
			</div>

			{#if categoryChips.length}
				<div class="mb-10">
					<div class="flex flex-wrap gap-1 sm:gap-3">
						{#each categoryChips as c (c.id)}
							<a
								class="p-1 group flex items-center rounded-full bg-layer border border-layer-line hover:border-line-3 focus:outline-hidden focus:border-line-3"
								href="/k/{c.slug}"
							>
								{#if c.menu_icon_url}
									<img
										src={c.menu_icon_url}
										alt=""
										width="32"
										height="32"
										loading="lazy"
										class="shrink-0 size-8 object-cover rounded-full"
									/>
								{:else}
									<span
										class="shrink-0 size-8 rounded-full bg-surface inline-flex items-center justify-center text-xs text-surface-foreground"
										>{c.name.slice(0, 1)}</span
									>
								{/if}
								<span class="grow py-1 ps-2 pe-3">
									<span
										class="text-[13px] font-medium text-layer-foreground group-hover:text-primary-hover group-focus:text-primary-focus"
										>{c.name}</span
									>
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Filter bar -->
			<div class="mb-6 flex flex-wrap justify-between items-center gap-3">
				<div class="lg:hidden grow">
					<button
						type="button"
						onclick={() => (filtersOpen = true)}
						class="flex items-center gap-x-2 text-xs sm:text-sm text-start text-foreground rounded-lg underline-offset-4 hover:underline focus:outline-hidden"
					>
						<SlidersHorizontal class="shrink-0 size-3.5" />
						Filtrai
					</button>
				</div>

				<div class="flex flex-wrap lg:justify-between lg:grow items-center">
					<span class="me-1 text-xs sm:text-sm text-foreground"
						>{total} {pluralLt(total, ['prekė', 'prekės', 'prekių'])}</span
					>

					<div class="lg:hidden mx-3 w-px h-3 bg-surface-2"></div>

					<div class="relative min-h-7.5 inline-flex items-center">
						<span class="me-1 text-xs sm:text-sm text-foreground">Rūšiuoti:</span>
						<select
							aria-label="Rūšiavimas"
							class="appearance-none py-1 ps-1.5 pe-7 text-xs sm:text-sm bg-transparent border-transparent text-foreground rounded-lg focus:ring-0 cursor-pointer"
							onchange={(e) => {
								const v = (e.target as HTMLSelectElement).value;
								goto(href({ sort: v || null }));
							}}
						>
							{#each sorts as [value, label] (value)}
								<option {value} selected={currentSort === value}>{label}</option>
							{/each}
						</select>
						<ChevronDown
							class="pointer-events-none absolute end-2 top-1/2 size-3.5 -translate-y-1/2 text-foreground"
						/>
					</div>
				</div>
			</div>
			<!-- End Filter Bar -->

			{#if currentPage > 1}
				<p class="mb-6">
					<a
						href={fromStartHref}
						data-sveltekit-noscroll
						class="text-sm text-foreground underline underline-offset-4 hover:text-primary-hover"
						>← Rodyti nuo pradžios</a
					>
				</p>
			{/if}

			{#if items.length}
				{#if listTemplate === 'list'}
					<ProductList products={items} />
				{:else}
					<ProductGrid products={items} priorityFirst={currentPage === 1} />
				{/if}
			{:else}
				<div class="py-16 text-center">
					<p class="font-medium text-foreground">Prekių nerasta</p>
					<p class="mt-1 text-sm text-muted-foreground-1">
						Pabandykite pakeisti filtrus arba paieškos frazę.
					</p>
					<a
						href={pathname}
						class="mt-4 inline-flex items-center text-sm text-foreground underline underline-offset-4 hover:text-primary-hover"
						>Išvalyti filtrus</a
					>
				</div>
			{/if}

			<!-- Infinite scroll sentinel -->
			{#if hasMore && items.length}
				<div bind:this={sentinel} class="h-px" aria-hidden="true"></div>
			{/if}

			{#if loading}
				<p class="mt-10 text-sm text-muted-foreground-1">
					<span class="inline-flex items-center gap-x-2 text-sm text-muted-foreground-1">
						<Loader2 class="animate-spin shrink-0 size-4" />
						Kraunama…
					</span>
				</p>
				<div class="mt-6 grid grid-cols-2 gap-y-10 gap-x-4 md:grid-cols-3 xl:grid-cols-4">
					{#each Array.from({ length: 4 }) as _, i (i)}
						<div class="animate-pulse">
							<div class="aspect-square rounded-xl bg-surface"></div>
							<div class="mt-3 h-4 w-3/4 rounded bg-surface"></div>
							<div class="mt-2 h-4 w-1/3 rounded bg-surface"></div>
						</div>
					{/each}
				</div>
			{/if}

			{#if loadError}
				<div class="mt-10 text-center">
					<p class="text-sm text-destructive">{loadError}</p>
					<button
						type="button"
						onclick={retry}
						class="mt-3 py-2 px-4 inline-flex justify-center items-center text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden"
						>Bandyti dar kartą</button
					>
				</div>
			{:else if hasMore && !loading}
				<div class="mt-10 text-center">
					<a
						href={nextHref}
						rel="next"
						data-sveltekit-preload-data="false"
						onclick={(e) => {
							e.preventDefault();
							loadMore();
						}}
						class="py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
						>Rodyti daugiau</a
					>
				</div>
			{/if}
		</div>
	</div>
</div>
