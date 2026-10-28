<script lang="ts">
	import { jsonLd } from '#lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Gamintojai — Baltijos Žvynas';
	const description = 'Visi žvejybos prekių gamintojai mūsų kataloge.';
	const canonical = $derived(`${data.origin}${data.pathname}`);
	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Gamintojai', item: canonical }
			]
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-8">
	<h1 class="text-2xl font-bold text-slate-900">Gamintojai</h1>
	{#if data.brands.length === 0}
		<p class="mt-6 text-slate-500">Gamintojų nerasta.</p>
	{:else}
		<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each data.brands as brand (brand.id)}
				<a
					href="/g/{brand.slug}"
					class="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-300 hover:shadow"
				>
					{#if brand.logo_url}
						<img
							src={brand.logo_url}
							alt={brand.name}
							class="max-h-12 w-auto object-contain"
							loading="lazy"
						/>
					{:else}
						<span class="text-center text-sm font-semibold text-slate-700">{brand.name}</span>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
