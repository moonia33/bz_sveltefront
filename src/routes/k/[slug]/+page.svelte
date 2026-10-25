<script lang="ts">
	import CatalogPage from '#lib/components/shop/CatalogPage.svelte';
	import CategoryLanding from '#lib/components/shop/CategoryLanding.svelte';
	import { jsonLd } from '#lib/seo';
	import type { Snapshot } from './$types';

	let { data } = $props();

	let catalog = $state<ReturnType<typeof CatalogPage> | undefined>();

	export const snapshot: Snapshot = {
		capture: () => catalog?.capture(),
		restore: (v) => catalog?.restore(v)
	};

	const cat = $derived(data.category);
	const title = $derived(`${cat.seo_title || cat.name} — Baltijos Žvynas`);
	const description = $derived(cat.seo_description || cat.description || `${cat.name} — žvejybos prekės.`);
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const breadcrumbs = $derived([
		{ name: 'Pradžia', href: '/' },
		{ name: 'Kategorijos', href: '/kategorijos' },
		...data.parentChain.map((c) => ({ name: c.name, href: `/k/${c.slug}` })),
		{ name: cat.name }
	]);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: breadcrumbs.map((b, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: b.name,
				item: `${data.origin}${b.href ?? data.pathname}`
			}))
		})
	);
	const itemListLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: (data.mode === 'landing'
				? data.topProducts
				: (data.products?.items ?? [])
			).map((p, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				url: `${data.origin}/p/${p.slug}`,
				name: p.name,
				image: p.images?.[0]?.url
			}))
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if data.mode === 'landing'}
		<meta name="robots" content="index,follow" />
	{:else if data.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
	{@html itemListLd}
</svelte:head>

{#if data.mode === 'landing'}
	<CategoryLanding
		category={cat}
		all={data.all}
		children={data.children}
		{breadcrumbs}
		topProducts={data.topProducts}
		facets={data.facets}
	/>
{:else}
	<CatalogPage
		bind:this={catalog}
		title={cat.name}
		description={cat.description || undefined}
		products={data.products}
		facets={data.facets}
		params={new URLSearchParams(data.params)}
		pathname={data.pathname}
		{breadcrumbs}
		categoryChips={data.categoryChips}
		categoryLinks={data.categoryLinks}
		categorySlug={cat.slug}
		listTemplate={cat.list_template}
	/>
{/if}
