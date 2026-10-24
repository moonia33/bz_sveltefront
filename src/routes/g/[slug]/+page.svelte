<script lang="ts">
	import { ChevronRight, PanelLeft } from '@lucide/svelte';
	import CategoryNav from '#lib/components/shop/CategoryNav.svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';
	import { jsonLd } from '#lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let navOpen = $state(false);

	const brand = $derived(data.brand);
	const catalogHref = $derived(`/katalogas?brand_slug=${encodeURIComponent(brand.slug)}`);
	const categories = $derived(brand.categories ?? []);

	const title = $derived(
		brand.seo_title ? `${brand.seo_title} — Baltijos Žvynas` : `${brand.name} — Baltijos Žvynas`
	);
	const description = $derived(
		brand.seo_description || brand.description || `Visos ${brand.name} prekės.`
	);
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: brand.name, item: canonical }
			]
		})
	);
	const brandLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Brand',
			name: brand.name,
			...(brand.logo_url ? { logo: brand.logo_url } : {}),
			url: canonical
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if brand.seo_keywords}
		<meta name="keywords" content={brand.seo_keywords} />
	{/if}
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index,follow" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	{#if brand.logo_url}
		<meta property="og:image" content={brand.logo_url} />
	{/if}
	{@html breadcrumbLd}
	{@html brandLd}
</svelte:head>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="grid grid-cols-1 lg:grid-cols-12">
		<div class="lg:col-span-3 lg:-ms-2.5 lg:pe-8">
			<CategoryNav all={data.all} bind:open={navOpen} />
		</div>

		<div class="lg:col-span-9">
			<!-- Mobile: sidebar trigger -->
			<div class="pt-5 lg:hidden flex justify-end">
				<button
					type="button"
					onclick={() => (navOpen = true)}
					aria-label="Atidaryti kategorijas"
					class="inline-flex items-center gap-x-2 py-1.5 px-3 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus"
				>
					<PanelLeft class="shrink-0 size-4" />
					Kategorijos
				</button>
			</div>

			<div class="pt-4 lg:pt-10">
				<nav aria-label="Naršymo kelias" class="mb-4">
					<ol class="flex items-center gap-x-1.5 text-sm">
						<li class="flex items-center gap-x-1.5">
							<a
								href="/"
								class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4"
								>Pradžia</a
							>
						</li>
						<li class="flex items-center gap-x-1.5">
							<ChevronRight class="size-3.5 text-muted-foreground-2" />
							<span class="text-foreground">{brand.name}</span>
						</li>
					</ol>
				</nav>

				<!-- Brand header -->
				<div class="flex items-center gap-x-4">
					{#if brand.logo_thumb_url || brand.logo_url}
						<img
							src={brand.logo_thumb_url ?? brand.logo_url ?? ''}
							alt={brand.logo_alt || brand.name}
							decoding="async"
							class="size-14 md:size-20 shrink-0 rounded-xl bg-layer border border-layer-line object-contain p-1.5"
						/>
					{/if}
					<div class="min-w-0">
						<h1 class="font-medium text-xl md:text-2xl text-foreground">{brand.name}</h1>
						{#if brand.description}
							<p class="mt-1 text-sm text-muted-foreground-1">{brand.description}</p>
						{/if}
					</div>
				</div>
				<!-- End Brand header -->

				<!-- Category shelf -->
				{#if categories.length}
					<div class="mt-8">
						<h2 class="mb-4 font-semibold text-xl text-foreground">Kategorijos</h2>
						<div class="flex flex-wrap gap-2">
							{#each categories as c (c.slug)}
								<a
									href="{catalogHref}&category_slug={encodeURIComponent(c.slug)}"
									class="py-1.5 px-3.5 bg-layer border border-layer-line rounded-full text-sm text-layer-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
								>
									{c.name}
									<span class="text-muted-foreground-1">({c.product_count})</span>
								</a>
							{/each}
						</div>
					</div>
				{/if}
				<!-- End Category shelf -->

				<!-- Top products -->
				{#if data.topProducts.length}
					<div class="py-10 lg:py-14">
						<ProductRow
							products={data.topProducts}
							title="Populiariausios"
							href="{catalogHref}&sort=best_selling"
						/>
					</div>
				{:else}
					<div class="py-10">
						<a
							href={catalogHref}
							class="inline-flex items-center gap-x-1.5 text-sm text-foreground underline underline-offset-4 hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
						>
							Žiūrėti visas {brand.name} prekės
							<ChevronRight class="shrink-0 size-4" />
						</a>
					</div>
				{/if}
				<!-- End Top products -->
			</div>
		</div>
	</div>
</div>
