<script lang="ts">
	import { ChevronRight, PanelLeft } from '@lucide/svelte';
	import { marked } from 'marked';
	import type { CatalogFacetsOut, CategoryOut, ProductListOut } from '#lib/api/types';
	import CategoryNav from '#lib/components/shop/CategoryNav.svelte';
	import CategoryCardGrid from '#lib/components/shop/CategoryCardGrid.svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';

	let {
		category,
		all = [],
		children = [],
		breadcrumbs = [],
		topProducts = [],
		facets = null
	}: {
		category: CategoryOut;
		all?: CategoryOut[];
		children?: CategoryOut[];
		breadcrumbs?: { name: string; href?: string }[];
		topProducts?: ProductListOut[];
		facets?: CatalogFacetsOut | null;
	} = $props();

	let navOpen = $state(false);

	const catalogHref = $derived(`/katalogas?category_slug=${encodeURIComponent(category.slug)}`);
	const brands = $derived((facets?.brands ?? []).slice(0, 12));
	const descHtml = $derived(
		category.description
			? marked.parse(String(category.description), { async: false, breaks: true })
			: ''
	);
</script>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="grid grid-cols-1 lg:grid-cols-12">
		<div class="lg:col-span-3 lg:-ms-2.5 lg:pe-8">
			<CategoryNav {all} activeSlug={category.slug} bind:open={navOpen} />
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

				<h1 class="font-medium text-xl md:text-2xl text-foreground">{category.name}</h1>
				{#if category.description}
					<div class="mt-1 text-sm text-muted-foreground-1 prose max-w-none dark:prose-invert">
						{@html descHtml}
					</div>
				{/if}

				<!-- Hero -->
				<div class="mt-6">
					{#if category.hero_image_url}
						<div class="relative h-40 md:h-56 rounded-xl overflow-hidden">
							<img
								src={category.hero_image_url}
								alt={category.name}
								decoding="async"
								class="absolute inset-0 size-full object-cover"
							/>
							<div class="absolute inset-0 bg-black/35"></div>
							<div
								class="relative z-10 size-full flex flex-col justify-center items-center text-center px-6"
							>
								<h2 class="font-semibold text-2xl md:text-3xl text-white">{category.name}</h2>
								<a
									href={catalogHref}
									class="mt-3 text-sm md:text-base text-white underline underline-offset-4 hover:text-white/80 focus:outline-hidden focus:text-white/80"
									>Žiūrėti visas kategorijos prekės</a
								>
							</div>
						</div>
					{:else}
						<div
							class="h-28 md:h-40 rounded-xl bg-linear-to-r from-primary-800 to-primary-950 flex flex-col justify-center items-center text-center px-6"
						>
							<h2 class="font-semibold text-xl md:text-3xl text-white">{category.name}</h2>
							<a
								href={catalogHref}
								class="mt-2 text-sm md:text-base text-white underline underline-offset-4 hover:text-white/80 focus:outline-hidden focus:text-white/80"
								>Žiūrėti visas kategorijos prekės</a
							>
						</div>
					{/if}
				</div>
				<!-- End Hero -->

				<!-- Sub-categories -->
				{#if children.length}
					<div class="py-10 lg:py-14">
						<h2 class="mb-6 font-semibold text-xl md:text-2xl text-foreground">Sub-kategorijos</h2>
						<CategoryCardGrid categories={children} {all} />
					</div>
				{/if}
				<!-- End Sub-categories -->

				<!-- Brands -->
				{#if brands.length}
					<div class="pb-10 lg:pb-14">
						<h2 class="mb-4 font-semibold text-xl text-foreground">Gamintojai</h2>
						<div class="flex flex-wrap gap-2">
							{#each brands as b (b.id)}
								<a
									href="/k/{category.slug}?brand_slug={b.slug}"
									class="inline-flex items-center gap-x-2 py-1.5 px-3.5 bg-layer border border-layer-line rounded-full text-sm text-layer-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
								>
									{#if b.logo_thumb_url || b.logo_url}
										<img
											src={b.logo_thumb_url ?? b.logo_url ?? ''}
											alt=""
											decoding="async"
											class="size-5 shrink-0 rounded-full object-contain"
										/>
									{/if}
									{b.name}
								</a>
							{/each}
						</div>
					</div>
				{/if}
				<!-- End Brands -->

				<!-- Top products -->
				{#if topProducts.length}
					<div class="pb-10 lg:pb-16">
						<ProductRow
							products={topProducts}
							title="Populiariausios"
							href="{catalogHref}&sort=best_selling"
						/>
					</div>
				{/if}
				<!-- End Top products -->
			</div>
		</div>
	</div>
</div>
