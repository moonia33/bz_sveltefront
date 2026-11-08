<script lang="ts">
	import { ChevronRight } from '@lucide/svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';
	import type { ProductListOut } from '#lib/api/types';
	import { fmtBlogDate } from '#lib/components/blog/date';
	import { jsonLd } from '#lib/seo';

	let { data } = $props();

	const post = $derived(data.post);
	const title = $derived(`${post.seo_title || post.title} — Baltijos Žvynas`);
	const description = $derived(post.seo_description || post.excerpt || '');
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const articleLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: post.title,
			description: description || undefined,
			image: post.cover_image ? [new URL(post.cover_image, data.origin).href] : undefined,
			datePublished: post.published_at ?? undefined,
			dateModified: post.updated_at,
			author: post.author_name ? { '@type': 'Person', name: post.author_name } : undefined,
			publisher: { '@type': 'Organization', name: 'Baltijos Žvynas' },
			mainEntityOfPage: canonical,
			inLanguage: post.language_code
		})
	);
	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Patarimai', item: `${data.origin}${data.base}` },
				{ '@type': 'ListItem', position: 3, name: post.title, item: canonical }
			]
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}<meta name="description" content={description} />{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	{#if post.cover_image}<meta property="og:image" content={new URL(post.cover_image, data.origin).href} />{/if}
	{#if post.published_at}<meta property="article:published_time" content={post.published_at} />{/if}
	{@html articleLd}
	{@html breadcrumbLd}
</svelte:head>

<article class="max-w-3xl mx-auto px-4 py-10">
	<nav aria-label="Naršymo kelias" class="mb-4">
		<ol class="flex flex-wrap items-center gap-x-1.5 text-sm">
			<li><a href="/" class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4">Pradžia</a></li>
			<li class="flex items-center gap-x-1.5">
				<ChevronRight class="size-3.5 text-muted-foreground-2" />
				<a href={data.base} class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4">Patarimai</a>
			</li>
		</ol>
	</nav>

	<h1 class="font-medium text-2xl md:text-4xl text-foreground">{post.title}</h1>
	<div class="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground-1">
		{#if post.author_name}<span>{post.author_name}</span>{/if}
		{#if post.published_at}<time datetime={post.published_at}>· {fmtBlogDate(post.published_at)}</time>{/if}
		{#if post.reading_minutes}<span>· {post.reading_minutes} min. skaitymo</span>{/if}
	</div>
	{#if post.categories.length}
		<div class="mt-3 flex flex-wrap gap-2">
			{#each post.categories as c (c.slug)}
				<a href={`${data.base}?kategorija=${encodeURIComponent(c.slug)}`} class="rounded-full border border-card-line px-3 py-0.5 text-xs text-foreground hover:border-primary">{c.name}</a>
			{/each}
		</div>
	{/if}

	{#if post.cover_image}
		<img
			src={post.cover_image}
			alt={post.cover_image_alt || post.title}
			class="mt-6 w-full rounded-xl"
			fetchpriority="high"
			decoding="async"
		/>
	{/if}

	<div class="mt-8 space-y-8">
		{#each post.content_blocks as block, i (i)}
			{#if block.type === 'html'}
				<div class="prose max-w-none dark:prose-invert">
					{@html String(block.payload?.html ?? '')}
				</div>
			{:else if block.type === 'products'}
				{@const products = (block.payload?.products ?? []) as ProductListOut[]}
				{#if products.length}
					<div class="not-prose">
						<ProductRow {products} title={String(block.payload?.title ?? '') || undefined} />
					</div>
				{/if}
			{/if}
		{/each}
	</div>
</article>

{#if post.related_products.length}
	<div class="py-10 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
		<ProductRow products={post.related_products} title="Straipsnyje minimos prekės" />
	</div>
{/if}
