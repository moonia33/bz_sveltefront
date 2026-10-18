<script lang="ts">
	import CatalogPage from '#lib/components/shop/CatalogPage.svelte';

	let { data } = $props();
	const title = $derived(data.params.q ? `Paieška: „${data.params.q}“` : 'Katalogas');
</script>

<svelte:head>
	<title>{title} — Baltijos Žvynas</title>
</svelte:head>

<CatalogPage
	{title}
	products={data.products}
	facets={data.facets}
	params={new URLSearchParams(data.params)}
/>
