<script lang="ts">
	import { marked } from 'marked';
	import { ShieldCheck, Truck, Undo2 } from '@lucide/svelte';
	import HeroCarousel from '#lib/components/home/HeroCarousel.svelte';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';
	import type { HomeSlide } from '#lib/api/endpoints';
	import type { CategoryOut, ProductListOut } from '#lib/api/types';

	let { data } = $props();

	const home = $derived(data.home);
	const sections = $derived(home?.sections ?? []);
	const title = $derived(home?.seo_title || 'Baltijos Žvynas — žvejybos prekės');
	const description = $derived(
		home?.seo_description ||
			'Žvejybos prekės: kabliukai, meškerės, ritės ir kitas inventorius su pristatymu visame regione.'
	);
	const canonical = $derived(`${data.origin}/`);

	function productGridHref(payload: Record<string, unknown>): string {
		const source = payload?.source;
		if (!source || typeof source !== 'object') return '/katalogas';
		const p = new URLSearchParams();
		for (const k of ['category_slug', 'brand_slug', 'group_code', 'q', 'sort']) {
			const v = (source as Record<string, unknown>)[k];
			if (v != null && v !== '') p.set(k, String(v));
		}
		const s = p.toString();
		return s ? `/katalogas?${s}` : '/katalogas';
	}

	function md(payload: Record<string, unknown>): string {
		return marked.parse(String(payload?.markdown ?? ''), { async: false });
	}

	function initials(name: string): string {
		return (
			name
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((w) => w[0])
				.join('')
				.toUpperCase() || '·'
		);
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index,follow" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
</svelte:head>

{#if sections.length}
	{#each sections as section, i (i)}
		{#if section.type === 'hero'}
			<div class="pt-4 sm:pt-6 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
				<HeroCarousel slides={(section.payload?.slides ?? []) as HomeSlide[]} />
			</div>
		{:else if section.type === 'category_grid'}
			{@const items = (section.items ?? []) as unknown as CategoryOut[]}
			{#if items.length}
				<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
					{#if section.payload?.title}
						<h2 class="mb-6 font-semibold text-xl md:text-2xl text-center text-foreground">
							{String(section.payload.title)}
						</h2>
					{/if}
					<div class="flex flex-wrap justify-center gap-y-5 gap-x-3 md:gap-x-5">
						{#each items as item (item.id)}
							{@const img = item.menu_icon_url ?? item.hero_image_url}
							<a
								class="group relative block w-16 sm:w-20 lg:w-24 text-center focus:outline-hidden"
								href="/k/{item.slug}"
							>
								{#if img}
									<img
										class="size-16 sm:size-20 lg:size-24 mx-auto object-cover bg-surface rounded-full ring-2 ring-offset-4 ring-offset-layer ring-transparent group-hover:ring-line-3"
										src={img}
										alt={item.name}
										loading="lazy"
										decoding="async"
									/>
								{:else}
									<span
										class="size-16 sm:size-20 lg:size-24 mx-auto inline-flex items-center justify-center bg-surface rounded-full ring-2 ring-offset-4 ring-offset-layer ring-transparent group-hover:ring-line-3 font-semibold text-lg text-surface-foreground"
										>{initials(item.name)}</span
									>
								{/if}
								<span class="mt-3 block text-sm break-words text-foreground">{item.name}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{:else if section.type === 'product_grid'}
			{@const products = (section.items ?? []) as unknown as ProductListOut[]}
			{#if products.length}
				<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
					<ProductRow
						{products}
						title={String(section.payload?.title ?? '') || undefined}
						href={productGridHref(section.payload ?? {})}
					/>
				</div>
			{/if}
		{:else if section.type === 'rich_text'}
			<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
				<div class="prose max-w-none dark:prose-invert">
					{@html md(section.payload ?? {})}
				</div>
			</div>
		{:else if section.type === 'newsletter'}
			<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
				<div class="max-w-md mx-auto">
					<div class="mb-2 flex items-center justify-center gap-x-2">
						<label for="home-newsletter" class="font-medium text-foreground"
							>{String(section.payload?.title ?? 'Prenumeruokite naujienlaiškį')}</label
						>
						<MissingFeature
							compact
							feature="Naujienlaiškio prenumerata"
							endpoint="POST /newsletter/subscribe"
						/>
					</div>
					<form
						class="flex items-center gap-2"
						onsubmit={(e) => {
							e.preventDefault();
						}}
					>
						<input
							id="home-newsletter"
							type="email"
							required
							placeholder={String(section.payload?.placeholder ?? 'El. pašto adresas')}
							class="py-3 px-4 block w-full bg-transparent border border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-line-3"
						/>
						<button
							type="submit"
							class="py-3 px-4 whitespace-nowrap inline-flex justify-center items-center gap-x-2 sm:text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus"
							>Prenumeruoti</button
						>
					</form>
				</div>
			</div>
		{:else}
			<div class="pt-10 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
				<MissingFeature feature={'Home sekcija: ' + section.type} />
			</div>
		{/if}
	{/each}
{:else}
	<!-- Fallback: homebuilder page not configured -->
	<div class="pt-4 sm:pt-6 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
		<div
			class="h-64 md:h-96 rounded-xl bg-linear-to-r from-primary-800 to-primary-950 flex flex-col justify-center items-center text-center px-6"
		>
			<h1 class="font-semibold text-3xl sm:text-4xl lg:text-5xl text-white">Baltijos Žvynas</h1>
			<p class="mt-3 max-w-xl text-sm md:text-base text-white/85">
				Žvejybos prekės su pristatymu visame regione.
			</p>
			<a
				href="/katalogas"
				class="mt-5 md:mt-8 text-sm md:text-base text-white underline underline-offset-4 hover:text-white/80 focus:outline-hidden focus:text-white/80"
				>Į katalogą</a
			>
		</div>
		<div class="mt-4">
			<MissingFeature
				feature="Pradžios puslapio turinys"
				endpoint="GET /home (homebuilder nekonfigūruotas)"
			/>
		</div>
	</div>
	{#if data.newest?.items?.length}
		<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
			<ProductRow
				products={data.newest.items}
				title="Naujausios prekės"
				href="/katalogas?sort=-created"
			/>
		</div>
	{/if}
{/if}

{#if data.recentlyViewed.length}
	<div class="pt-14 lg:pt-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
		<ProductRow products={data.recentlyViewed} title="Neseniai peržiūrėta" />
	</div>
{/if}

<!-- USP icon section -->
<div class="py-14 lg:py-20 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-4">
		<div class="max-w-xs lg:max-w-full mx-auto text-center lg:px-4 xl:px-10">
			<ShieldCheck class="shrink-0 size-7 mx-auto text-foreground" stroke-width="1.5" />
			<p class="mt-3 font-medium text-foreground">Saugus apmokėjimas</p>
			<p class="mt-2 text-sm text-muted-foreground-1">
				Atsiskaitykite saugiai — mokėjimai šifruojami ir apdorojami per patikimus tiekėjus.
			</p>
		</div>
		<div class="max-w-xs lg:max-w-full mx-auto text-center lg:px-4 xl:px-10">
			<Truck class="shrink-0 size-7 mx-auto text-foreground" stroke-width="1.5" />
			<p class="mt-3 font-medium text-foreground">Nemokamas pristatymas nuo 50 €</p>
			<p class="mt-2 text-sm text-muted-foreground-1">
				Užsakymams nuo 50 € pristatymas visame regione — nemokamai.
			</p>
		</div>
		<div class="max-w-xs lg:max-w-full mx-auto text-center lg:px-4 xl:px-10">
			<Undo2 class="shrink-0 size-7 mx-auto text-foreground" stroke-width="1.5" />
			<p class="mt-3 font-medium text-foreground">Lankstus grąžinimas</p>
			<p class="mt-2 text-sm text-muted-foreground-1">
				Netiko prekė? Grąžinkite ją per 30 dienų ir susigrąžinkite pinigus.
			</p>
		</div>
	</div>
</div>
<!-- End USP icon section -->
