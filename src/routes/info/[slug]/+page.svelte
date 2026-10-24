<script lang="ts">
	import { marked } from 'marked';
	import { ChevronRight } from '@lucide/svelte';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import { jsonLd } from '#lib/seo';

	let { data } = $props();

	const cms = $derived(data.page);
	const title = $derived(`${cms.seo_title || cms.title} — Baltijos Žvynas`);
	const description = $derived(cms.seo_description || '');
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: cms.title, item: canonical }
			]
		})
	);

	function md(payload: Record<string, unknown>): string {
		return marked.parse(String(payload?.markdown ?? payload?.text ?? ''), { async: false });
	}
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={title} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-10">
	<nav aria-label="Naršymo kelias" class="mb-4">
		<ol class="flex items-center gap-x-1.5 text-sm">
			<li class="flex items-center gap-x-1.5">
				<a
					href="/"
					class="text-muted-foreground-1 hover:text-foreground hover:underline underline-offset-4"
					>Pradžia</a
				>
			</li>
			<li class="flex items-center gap-x-1.5">
				<ChevronRight class="size-3.5 text-muted-foreground-2" />
				<span class="text-foreground">{cms.title}</span>
			</li>
		</ol>
	</nav>

	<h1 class="font-medium text-2xl md:text-3xl text-foreground">{cms.title}</h1>

	<div class="mt-6 space-y-6">
		{#each cms.content_blocks ?? [] as block, i (i)}
			{#if block.type === 'markdown' || block.type === 'rich_text'}
				<div class="prose max-w-none dark:prose-invert">
					{@html md(block.payload ?? {})}
				</div>
			{:else if block.type === 'html'}
				<div class="prose max-w-none dark:prose-invert">
					{@html String(block.payload?.html ?? '')}
				</div>
			{:else if block.type === 'image'}
				{@const src = (block.payload?.src ?? block.payload?.url) as string | undefined}
				{#if src}
					<img
						{src}
						alt={String(block.payload?.alt ?? cms.title)}
						loading="lazy"
						decoding="async"
						class="w-full rounded-xl"
					/>
				{:else}
					<MissingFeature feature="CMS blokas: image (be src/url)" />
				{/if}
			{:else}
				<MissingFeature feature={'CMS blokas: ' + block.type} />
			{/if}
		{/each}
	</div>
</div>
