<script lang="ts">
	import { jsonLd } from '#lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const title = 'Kolekcijos — Baltijos Žvynas';
	const description = 'Prekių kolekcijos ir serijos.';
	const canonical = $derived(`${data.origin}${data.pathname}`);
	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Kolekcijos', item: canonical }
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
	<h1 class="text-2xl font-bold text-slate-900">Kolekcijos</h1>
	{#if data.groups.length === 0}
		<p class="mt-6 text-slate-500">Kolekcijų nerasta.</p>
	{:else}
		<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.groups as group (group.id)}
				<a
					href="/kolekcijos/{group.code}"
					class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow"
				>
					<h2 class="font-semibold text-slate-900">{group.name}</h2>
					{#if group.description}
						<p class="mt-1 line-clamp-2 text-sm text-slate-500">{group.description}</p>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
