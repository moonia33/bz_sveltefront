<script lang="ts">
	import { goto } from '$app/navigation';
	import FilterSidebar from '#lib/components/shop/FilterSidebar.svelte';
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import { ChevronDown } from '@lucide/svelte';
	import type { CatalogFacetsOut, Paginated, ProductListOut } from '#lib/api/types';

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

	const page = $derived(Math.max(1, Number(params.get('page') ?? 1) || 1));
	const pageSize = 20;
	const pages = $derived(Math.max(1, Math.ceil(products.count / pageSize)));
	const currentSort = $derived(params.get('sort') ?? '');

	function href(patch: Record<string, string | null>): string {
		const p = new URLSearchParams(params);
		p.delete('page');
		for (const [k, v] of Object.entries(patch)) {
			if (v === null || v === '') p.delete(k);
			else p.set(k, v);
		}
		const s = p.toString();
		return `?${s}`;
	}

	function pageHref(n: number): string {
		const p = new URLSearchParams(params);
		if (n <= 1) p.delete('page');
		else p.set('page', String(n));
		const s = p.toString();
		return `?${s}`;
	}
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
					{products.count} prekė(-ių)
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

			{#if products.items.length}
				<ProductGrid products={products.items} />
			{:else}
				<div class="rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-neutral-700">
					<p class="text-gray-500 dark:text-neutral-400">Prekių nerasta.</p>
				</div>
			{/if}

			{#if pages > 1}
				<nav class="mt-8 flex items-center justify-center gap-x-1" aria-label="Puslapiai">
					{#if page > 1}
						<a
							href={pageHref(page - 1)}
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>‹ Ankstesnis</a
						>
					{/if}
					{#each Array.from({ length: pages }, (_, i) => i + 1) as n (n)}
						{#if n === 1 || n === pages || Math.abs(n - page) <= 2}
							<a
								href={pageHref(n)}
								aria-current={n === page ? 'page' : undefined}
								class="rounded-lg px-3 py-2 text-sm {n === page
									? 'bg-zvynas-600 font-semibold text-white'
									: 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}"
								>{n}</a
							>
						{:else if Math.abs(n - page) === 3}
							<span class="px-1 text-gray-400">…</span>
						{/if}
					{/each}
					{#if page < pages}
						<a
							href={pageHref(page + 1)}
							class="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>Kitas ›</a
						>
					{/if}
				</nav>
			{/if}
		</div>
	</div>
</div>
