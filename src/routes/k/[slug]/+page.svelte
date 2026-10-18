<script lang="ts">
	import CatalogPage from '#lib/components/shop/CatalogPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.category.seo_title || data.category.name} — Baltijos Žvynas</title>
	{#if data.category.seo_description}
		<meta name="description" content={data.category.seo_description} />
	{/if}
</svelte:head>

{#if data.category.description}
	<div class="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
		<p class="text-sm text-gray-500 dark:text-neutral-400">{data.category.description}</p>
	</div>
{/if}

<CatalogPage
	title={data.category.name}
	products={data.products}
	facets={data.facets}
	params={new URLSearchParams(data.params)}
/>
