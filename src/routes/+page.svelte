<script lang="ts">
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import type { ProductListOut } from '#lib/api/types';

	let { data } = $props();
	const home = $derived(data.home);
	const sections = $derived(home?.sections ?? []);
	let slideIndex = $state(0);
</script>

<svelte:head>
	<title>{home?.seo_title || 'Baltijos Žvynas — žvejybos prekės'}</title>
	{#if home?.seo_description}
		<meta name="description" content={home.seo_description} />
	{/if}
</svelte:head>

{#if sections.length}
	{#each sections as section, i (i)}
		{#if section.type === 'hero' && (section.payload?.slides as any[])?.length}
			{@const slides = section.payload.slides as any[]}
			{@const slide = slides[Math.min(slideIndex, slides.length - 1)]}
			<section class="relative isolate overflow-hidden bg-neutral-900">
				<img
					src={slide.image.src}
					alt={slide.image.alt || slide.title}
					class="absolute inset-0 -z-10 h-full w-full object-cover opacity-60"
				/>
				<div class="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
					<h1 class="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
						{slide.title}
					</h1>
					{#if slide.subtitle}
						<p class="mt-4 max-w-xl text-lg text-white/80">{slide.subtitle}</p>
					{/if}
					{#if slide.cta?.url}
						<a
							href={slide.cta.url}
							class="mt-8 inline-flex items-center rounded-full bg-zvynas-600 px-6 py-3 text-sm font-semibold text-white hover:bg-zvynas-700"
						>
							{slide.cta.label || 'Žiūrėti'}
						</a>
					{/if}
				</div>
				{#if slides.length > 1}
					<div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-x-2">
						{#each slides as _s, idx (idx)}
							<button
								type="button"
								aria-label="Skaidrė {idx + 1}"
								class="size-2.5 rounded-full transition {idx === slideIndex
									? 'bg-white'
									: 'bg-white/40'}"
								onclick={() => (slideIndex = idx)}
							></button>
						{/each}
					</div>
				{/if}
			</section>
		{:else if section.type === 'product_grid' && (section.items?.length ?? 0) > 0}
			<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				{#if section.payload?.title}
					<h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
						{section.payload.title}
					</h2>
				{/if}
				<ProductGrid products={section.items as unknown as ProductListOut[]} />
			</section>
		{:else if section.type === 'category_grid' && (section.items?.length ?? 0) > 0}
			<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				{#if section.payload?.title}
					<h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
						{section.payload.title}
					</h2>
				{/if}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
					{#each section.items ?? [] as item (JSON.stringify(item))}
						<a
							href="/k/{item.slug}"
							class="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-4 text-center hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
						>
							{#if item.image}
								<img
									src={item.image as string}
									alt={(item.name as string) ?? ''}
									width="96"
									height="96"
									loading="lazy"
									class="mb-3 size-24 rounded-full object-cover"
								/>
							{/if}
							<span class="text-sm font-medium text-gray-800 dark:text-neutral-200"
								>{item.name}</span
							>
						</a>
					{/each}
				</div>
			</section>
		{:else if section.type === 'rich_text'}
			<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
				<div class="prose max-w-none dark:prose-invert">
					{@html section.payload?.html ?? section.payload?.text ?? ''}
				</div>
			</section>
		{/if}
	{/each}
{:else}
	<section class="bg-neutral-900">
		<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
			<h1 class="text-3xl font-bold tracking-tight text-white sm:text-5xl">Baltijos Žvynas</h1>
			<p class="mt-4 max-w-xl text-lg text-white/70">Žvejybos prekės su pristatymu visame regione.</p>
			<a
				href="/katalogas"
				class="mt-8 inline-flex items-center rounded-full bg-zvynas-600 px-6 py-3 text-sm font-semibold text-white hover:bg-zvynas-700"
				>Į katalogą</a
			>
		</div>
	</section>
	{#if data.fallback?.items?.length}
		<section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			<h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Naujausios prekės</h2>
			<ProductGrid products={data.fallback.items} />
		</section>
	{/if}
{/if}
