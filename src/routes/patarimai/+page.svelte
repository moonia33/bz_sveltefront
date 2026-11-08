<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import BlogPostCard from '#lib/components/blog/BlogPostCard.svelte';
	import { jsonLd } from '#lib/seo';

	let { data } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.posts.total_count / data.posts.page_size)));
	const activeCategory = $derived(data.categories.find((c) => c.slug === data.category) ?? null);
	const title = $derived(
		`${activeCategory ? `${activeCategory.name} — ` : ''}Patarimai — Baltijos Žvynas`
	);
	const description = $derived(
		activeCategory?.description || 'Žvejybos patarimai, gidai ir naujienos iš Baltijos Žvyno.'
	);
	const canonical = $derived(
		`${data.origin}${data.pathname}${data.category ? `?kategorija=${encodeURIComponent(data.category)}` : ''}`
	);

	function pageHref(p: number) {
		const sp = new URLSearchParams();
		if (data.category) sp.set('kategorija', data.category);
		if (p > 1) sp.set('page', String(p));
		const q = sp.toString();
		return q ? `${data.pathname}?${q}` : data.pathname;
	}

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Patarimai', item: `${data.origin}${data.pathname}` }
			]
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	{@html breadcrumbLd}
</svelte:head>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto py-10">
	<nav aria-label="Naršymo kelias" class="mb-4">
		<ol class="flex items-center gap-x-1.5 text-sm">
			<li><a href="/" class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4">Pradžia</a></li>
			<li class="flex items-center gap-x-1.5">
				<ChevronRight class="size-3.5 text-muted-foreground-2" />
				<span class="text-foreground">Patarimai</span>
			</li>
		</ol>
	</nav>

	<h1 class="font-medium text-2xl md:text-3xl text-foreground">{activeCategory?.name ?? 'Patarimai'}</h1>
	{#if activeCategory?.description}
		<p class="mt-2 max-w-2xl text-muted-foreground-1">{activeCategory.description}</p>
	{/if}

	{#if data.categories.length}
		<div class="mt-6 flex flex-wrap gap-2">
			<a
				href={data.pathname}
				class="rounded-full border px-3 py-1 text-sm {data.category ? 'border-card-line text-foreground' : 'border-primary bg-primary text-primary-foreground'}"
				>Visi</a
			>
			{#each data.categories as c (c.slug)}
				<a
					href={`${data.pathname}?kategorija=${encodeURIComponent(c.slug)}`}
					class="rounded-full border px-3 py-1 text-sm {data.category === c.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-card-line text-foreground'}"
					>{c.name}</a
				>
			{/each}
		</div>
	{/if}

	{#if data.posts.results.length}
		<div class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.posts.results as post (post.id)}
				<BlogPostCard {post} base={data.pathname} />
			{/each}
		</div>
	{:else}
		<p class="mt-8 text-muted-foreground-1">Straipsnių dar nėra.</p>
	{/if}

	{#if totalPages > 1}
		<nav aria-label="Puslapiai" class="mt-10 flex items-center justify-center gap-2 text-sm">
			{#if data.posts.page > 1}
				<a href={pageHref(data.posts.page - 1)} rel="prev" class="rounded-lg border border-card-line px-3 py-1.5">Ankstesnis</a>
			{/if}
			<span class="text-muted-foreground-1">{data.posts.page} / {totalPages}</span>
			{#if data.posts.page < totalPages}
				<a href={pageHref(data.posts.page + 1)} rel="next" class="rounded-lg border border-card-line px-3 py-1.5">Kitas</a>
			{/if}
		</nav>
	{/if}
</div>
