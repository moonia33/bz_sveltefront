<script lang="ts">
	import { marked } from 'marked';
	import { ChevronRight } from '@lucide/svelte';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';
	import type { ProductListOut } from '#lib/api/types';
	import { jsonLd } from '#lib/seo';

	let { data } = $props();

	const cms = $derived(data.page);
	const title = $derived(`${cms.seo_title || cms.title} — Baltijos Žvynas`);
	const description = $derived(cms.seo_description || '');
	const canonical = $derived(`${data.origin}${data.pathname}`);
	const legal = $derived(cms.legal ?? null);

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString('lt-LT', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			timeZone: 'Europe/Vilnius'
		});

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
		// breaks:true — viengubos eilutės „•" sąrašuose išlaikomos.
		return marked.parse(String(payload?.markdown ?? payload?.text ?? ''), {
			async: false,
			breaks: true
		});
	}
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	<link rel="canonical" href={canonical} />
	{#if legal && !legal.is_current}
		<meta name="robots" content="noindex" />
	{/if}
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

	{#if legal}
		<p class="mt-2 text-sm text-muted-foreground-1">
			Redakcija {legal.version}, {legal.is_upcoming ? 'įsigalios' : 'galioja'} nuo {fmtDate(legal.effective_from)}
		</p>
		{#if legal.is_upcoming}
			<div
				class="mt-4 rounded-lg border border-card-line bg-surface px-4 py-3 text-sm text-foreground"
			>
				Tai būsima dokumento redakcija, dar neįsigaliojusi.
				<a href={data.pathname} class="font-medium text-primary underline">Žiūrėti galiojančią</a>
			</div>
		{:else if !legal.is_current}
			<div
				class="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
			>
				Tai ankstesnė dokumento redakcija.
				<a href={data.pathname} class="font-medium underline">Žiūrėti galiojančią</a>
			</div>
		{:else if legal.upcoming}
			<div
				class="mt-4 rounded-lg border border-card-line bg-surface px-4 py-3 text-sm text-foreground"
			>
				Nuo {fmtDate(legal.upcoming.effective_from)} įsigalios nauja redakcija.
				<a href={`${data.pathname}?version=${encodeURIComponent(legal.upcoming.version)}`} class="font-medium text-primary underline">Peržiūrėti</a>
			</div>
		{/if}
		{#if legal.change_summary}
			<div class="mt-4 rounded-lg border border-card-line bg-surface px-4 py-3 text-sm">
				<p class="font-medium text-foreground">Kas pasikeitė</p>
				<p class="mt-1 whitespace-pre-line text-muted-foreground-1">{legal.change_summary}</p>
			</div>
		{/if}
	{/if}

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
			{:else if block.type === 'products'}
				{@const products = (block.payload?.products ?? []) as ProductListOut[]}
				{#if products.length}
					<ProductRow {products} title={String(block.payload?.title ?? '') || undefined} />
				{/if}
			{:else}
				<MissingFeature feature={'CMS blokas: ' + block.type} />
			{/if}
		{/each}
	</div>

	{#if legal && legal.versions.length > 1}
		<section class="mt-12 border-t border-card-line pt-6">
			<h2 class="font-medium text-lg text-foreground">Ankstesnės redakcijos</h2>
			<ul class="mt-3 space-y-1.5 text-sm">
				{#each legal.versions as v (v.version)}
					<li>
						{#if v.version === legal.version}
							<span class="text-foreground">{v.version} (nuo {fmtDate(v.effective_from)})</span>
						{:else}
							<a
								href={v.is_current ? data.pathname : `${data.pathname}?version=${encodeURIComponent(v.version)}`}
								class="text-primary underline underline-offset-4"
								>{v.version} (nuo {fmtDate(v.effective_from)})</a
							>
						{/if}
						{#if v.is_current}<span class="text-muted-foreground-1"> — galiojanti</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
