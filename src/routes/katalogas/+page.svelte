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

	const title = $derived(`${data.title} — Baltijos Žvynas`);
	const description = 'Visos žvejybos prekės: kabliukai, meškerės, ritės ir kitas inventorius.';
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: data.title, item: canonical }
			]
		})
	);
	const itemListLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			itemListElement: (data.products.items ?? []).map((p, i) => ({
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
	{#if data.noindex}
		<meta name="robots" content={data.nofollow ? 'noindex, nofollow' : 'noindex, follow'} />
	{/if}
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
	{@html itemListLd}
</svelte:head>

<CatalogPage
	bind:this={catalog}
	title={data.title}
	products={data.products}
	facets={data.facets}
	params={new URLSearchParams(data.params)}
	pathname={data.pathname}
	breadcrumbs={[
		{ name: 'Pradžia', href: '/' },
		{ name: data.title }
	]}
/>
