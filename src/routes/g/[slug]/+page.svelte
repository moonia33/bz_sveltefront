<script lang="ts">
	import CatalogPage from '#lib/components/shop/CatalogPage.svelte';
	import { jsonLd } from '#lib/seo';
	import type { Snapshot } from './$types';

	let { data } = $props();
	let catalog = $state<ReturnType<typeof CatalogPage> | undefined>();
	export const snapshot: Snapshot = {
		capture: () => catalog?.capture(),
		restore: (v) => catalog?.restore(v)
	};

	const brand = $derived(data.brand);
	const title = $derived(
		data.seoTitle ? `${data.seoTitle} — Baltijos Žvynas` : `${brand.name} — Baltijos Žvynas`
	);
	const canonical = $derived(`${data.origin}${data.pathname}`);
	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Gamintojai', item: `${data.origin}/gamintojai` },
				{ '@type': 'ListItem', position: 3, name: brand.name, item: canonical }
			]
		})
	);
	const brandLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Brand',
			name: brand.name,
			...(data.logoUrl ? { logo: data.logoUrl } : {}),
			url: canonical
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={data.description} />
	<link rel="canonical" href={canonical} />
	{#if data.noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={data.description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
	{@html brandLd}
</svelte:head>

{#if data.logoUrl}
	<div class="mx-auto max-w-6xl px-4 pt-6">
		<img src={data.logoUrl} alt={brand.name} class="h-12 w-auto object-contain" loading="lazy" />
	</div>
{/if}

<CatalogPage
	bind:this={catalog}
	title={data.title}
	description={data.description}
	products={data.products}
	facets={data.facets}
	params={new URLSearchParams(data.params)}
	pathname={data.pathname}
	breadcrumbs={[
		{ name: 'Pradžia', href: '/' },
		{ name: 'Gamintojai', href: '/gamintojai' },
		{ name: brand.name }
	]}
/>
