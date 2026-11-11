<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ChevronDown, ChevronRight, Loader2, SlidersHorizontal } from '@lucide/svelte';
	import FilterSidebar from '#lib/components/shop/FilterSidebar.svelte';
	import CategoryNav from '#lib/components/shop/CategoryNav.svelte';
	import CategoryCardGrid from '#lib/components/shop/CategoryCardGrid.svelte';
	import CategoryCircleRow from '#lib/components/shop/CategoryCircleRow.svelte';
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import ProductList from '#lib/components/shop/ProductList.svelte';
	import type {
		CatalogFacetsOut,
		CategoryImageOut,
		CategoryOut,
		Paginated,
		ProductListOut
	} from '#lib/api/types';
	import CategoryImg from '#lib/components/shop/CategoryImg.svelte';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { m } from '#lib/paraglide/messages';
	import { unit } from '#lib/i18n/units';

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
		categoryFilter = false,
		categoryPool = [],
		hiddenFacets = [],
		navTree,
		listTemplate = 'grid',
		pageSize = 20,
		fixedParams = {},
		defaultParams = {},
		logoUrl,
		heroUrl,
		heroImage = null,
		intro,
		chipPool
	}: {
		title: string;
		description?: string;
		logoUrl?: string;
		products: Paginated<ProductListOut>;
		// Promise – kliento navigacijoje filtrai įsikrauna po prekių.
		facets: CatalogFacetsOut | Promise<CatalogFacetsOut>;
		params: URLSearchParams;
		pathname: string;
		breadcrumbs?: { name: string; href?: string }[];
		categoryChips?: CategoryOut[];
		categoryLinks?: { slug: string; name: string }[];
		// Sidebar'e rodomas kategorijų facet'as (brand "parduotuvė" režimas).
		categoryFilter?: boolean;
		// Slug→name žemėlapis pasirinktos kategorijos chip'ui (visos kategorijos).
		categoryPool?: { slug: string; name: string }[];
		// Facet sekcijų slėpimas (pvz. 'brands' brand puslapyje).
		hiddenFacets?: ('brands' | 'groups' | 'categories')[];
		// Jei nurodytas — sidebar'as rodo kategorijų medį vietoj facet'ų
		// (pilnas /katalogas: medis užtenka, facet'ų užklausa atšaukiama).
		navTree?: CategoryOut[];
		listTemplate?: 'grid' | 'list';
		pageSize?: number;
		// Path-implied filtrai: visada pridedami prie load-more užklausos
		// (brand_slug, group_code, collection, channel, category_slug).
		fixedParams?: Record<string, string>;
		// Puslapio default'ai — tik jei URL neturi tokio parametro (sort).
		defaultParams?: Record<string, string>;
		// Hero banneris virš pavadinimo (kategorijos hero_image).
		heroUrl?: string;
		heroImage?: CategoryImageOut | null;
		// Papildomas turinys po pavadinimu (pvz. veiklos plytelės ir kategorijų chip'ai).
		intro?: Snippet;
		// Pilnas kategorijų sąrašas — nusprendžia ar chip'as turi vaikų
		// (su vaikais → kortelės, be vaikų → apvalūs chips'ai).
		chipPool?: CategoryOut[];
	} = $props();

	let items = $state<ProductListOut[]>(products.items ?? []);
	let total = $state(products.count ?? 0);
	let lastPage = $state(Math.max(1, Number(params.get('page') ?? 1) || 1));
	let loading = $state(false);
	let loadError = $state<string | null>(null);
	let filtersOpen = $state(false);

	// Chip'ai: tik KAI VISI lapiniai (be vaikų) → apvalūs chips'ai.
	// Mikso nedarom — bent vienam tėvui viskas kortelėse.
	// Be chipPool nežinom ar chip'as turi vaikų → viskas kortelėse.
	const allLeaves = $derived(
		(chipPool ?? []).length > 0 &&
			categoryChips.length > 0 &&
			categoryChips.every(
				(c) => !(chipPool ?? []).some((k) => k.parent_id === c.id)
			)
	);
	const circleChips = $derived(allLeaves ? categoryChips : []);
	const cardChips = $derived(allLeaves ? [] : categoryChips);
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
			for (const [k, v] of Object.entries(defaultParams)) if (!p.has(k)) p.set(k, v);
			for (const [k, v] of Object.entries(fixedParams)) p.set(k, v);
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
			loadError = m.cat_load_more_error();
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
		['', m.sort_recommended()],
		['best_selling', m.sort_best_selling()],
		['price', m.sort_price_asc()],
		['-price', m.sort_price_desc()],
		['-created', 'Naujausios'],
		['discounted', 'Su nuolaida'],
		['name', 'Pavadinimas A–Ž']
	];
</script>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="lg:flex">
		{#if navTree}
			<div class="lg:w-72 lg:shrink-0 lg:pe-8 border-e border-sidebar-line bg-sidebar">
				<CategoryNav all={navTree} bind:open={filtersOpen} />
			</div>
		{:else}
			{#await facets}
				<aside
					class="hidden lg:block lg:w-72 lg:shrink-0 lg:pe-8 pt-10 border-e border-sidebar-line bg-sidebar"
					aria-busy="true"
					aria-label="Kraunami filtrai"
				>
					{#each [5, 4, 6] as rows, i (i)}
						<div class="pb-6 mb-6 border-b border-sidebar-divider animate-pulse">
							<div class="h-3.5 w-24 mb-4 rounded-sm bg-surface"></div>
							{#each Array(rows) as _, j (j)}
								<div class="h-3 mb-3 rounded-sm bg-surface" style:width="{55 + ((j * 17) % 35)}%"></div>
							{/each}
						</div>
					{/each}
				</aside>
			{:then loaded}
				<FilterSidebar
					facets={loaded}
					{params}
					bind:open={filtersOpen}
					{categoryLinks}
					{categoryFilter}
					{categoryPool}
					{hiddenFacets}
				/>
			{/await}
		{/if}

		<div class="grow min-w-0 pt-6 lg:pt-10 lg:ps-8">
			{#if heroUrl}
				<div class="relative mb-6 overflow-hidden rounded-xl bg-surface">
					<CategoryImg
						image={heroImage}
						src={heroUrl}
						alt={title}
						width={1600}
						height={500}
						sizes="(min-width: 1360px) 1000px, (min-width: 1024px) 75vw, 100vw"
						priority
						class="aspect-[16/5] w-full object-cover"
					/>
					<span
						class="absolute bottom-4 right-5 sm:bottom-5 sm:right-6 font-semibold text-2xl sm:text-3xl text-white [text-shadow:-1.5px_-1.5px_0_#000,1.5px_-1.5px_0_#000,-1.5px_1.5px_0_#000,1.5px_1.5px_0_#000,0_3px_8px_rgb(0_0_0/0.5)]"
					>
						{title}
					</span>
				</div>
			{/if}
			{#if breadcrumbs.length}
				<nav aria-label={m.breadcrumb_aria()} class="mb-4">
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

			<div class="mb-4 flex items-center gap-x-3">
				{#if logoUrl}
					<img
						src={logoUrl}
						alt={title}
						loading="lazy"
						decoding="async"
						class="h-10 w-auto shrink-0 object-contain"
					/>
				{/if}
				<div class="min-w-0">
					<h1 class={heroUrl ? 'sr-only' : 'font-medium text-xl text-foreground'}>{title}</h1>
					{#if description}
						<div
							class="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground-1 [&_p]:mb-2 [&_strong]:font-medium [&_strong]:text-foreground [&_b]:font-medium [&_b]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:ps-5 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-medium [&_h2]:text-foreground [&_h3]:mt-3 [&_h3]:font-medium [&_h3]:text-foreground"
						>
							{@html description}
						</div>
					{/if}
				</div>
			</div>

			{#if intro}
				<div class="mb-8">{@render intro()}</div>
			{/if}
			{#if cardChips.length}
				<div class="mb-10">
					<CategoryCardGrid categories={cardChips} all={chipPool ?? []} priority />
				</div>
			{/if}
			{#if circleChips.length}
				<div class="mb-10">
					<CategoryCircleRow categories={circleChips} />
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
						{navTree ? m.cat_categories() : m.filters_title()}
					</button>
				</div>

				<div class="flex flex-wrap lg:justify-between lg:grow items-center">
					<span class="me-1 text-xs sm:text-sm text-foreground"
						>{total} {unit('product', total)}</span
					>

					<div class="lg:hidden mx-3 w-px h-3 bg-surface-2"></div>

					<div class="relative min-h-7.5 inline-flex items-center">
						<span class="me-1 text-xs sm:text-sm text-foreground">{m.sort_by()}</span>
						<select
							aria-label={m.sort_label()}
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
						>{m.cat_back_to_start()}</a
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
					<p class="font-medium text-foreground">{m.cat_no_products()}</p>
					<p class="mt-1 text-sm text-muted-foreground-1">
						{m.cat_empty_hint()}
					</p>
					<a
						href={pathname}
						class="mt-4 inline-flex items-center text-sm text-foreground underline underline-offset-4 hover:text-primary-hover"
						>{m.filters_clear()}</a
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
						>{m.ui_retry()}</button
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
						>{m.ui_show_more()}</a
					>
				</div>
			{/if}
		</div>
	</div>
</div>
