<script lang="ts">
	import ActivityTiles from '#lib/components/shop/ActivityTiles.svelte';
	import CatalogPage from '#lib/components/shop/CatalogPage.svelte';
	import { lh } from '#lib/i18n/instance';
	import { m } from '#lib/paraglide/messages';
	import { jsonLd } from '#lib/seo';
	import type { Snapshot } from './$types';

	let { data } = $props();
	let catalog = $state<ReturnType<typeof CatalogPage> | undefined>();
	export const snapshot: Snapshot = {
		capture: () => catalog?.capture(),
		restore: (v) => catalog?.restore(v)
	};

	const a = $derived(data.activity);
	const title = $derived(`${a.seo_title || a.name} — Baltijos Žvynas`);
	const description = $derived(
		a.seo_description || a.short_description || m.act_fallback_desc({ name: a.name })
	);
	const canonical = $derived(`${data.origin}${data.pathname}`);
	const children = $derived(a.children.filter((c) => c.visible));
	const topCategories = $derived(a.top_categories.filter((c) => c.slug !== 'nepriskirta'));
	const selectedCategory = $derived(data.params.category_slug ?? '');

	function categoryHref(slug: string): string {
		const p = new URLSearchParams(data.params);
		p.delete('page');
		if (selectedCategory === slug) p.delete('category_slug');
		else p.set('category_slug', slug);
		const q = p.toString();
		return `${data.pathname}${q ? `?${q}` : ''}`;
	}

	// short_description – paprastas tekstas, o CatalogPage aprašymą rodo per {@html}.
	const escapeHtml = (t: string) =>
		t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

	const breadcrumbs = $derived([
		{ name: m.ui_home(), href: lh('/') },
		{ name: m.nav_activities(), href: lh('/veiklos') },
		...(a.parent ? [{ name: a.parent.name, href: lh(`/veiklos/${a.parent.code}`) }] : []),
		{ name: a.name }
	]);
	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: breadcrumbs.map((b, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: b.name,
				item: `${data.origin}${b.href ?? data.pathname}`
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
	{#if a.image_url}<meta property="og:image" content={a.image_url} />{/if}
	{@html breadcrumbLd}
</svelte:head>

{#snippet intro()}
{#if children.length || topCategories.length}
	<div>
		{#if children.length}
			<ActivityTiles activities={children} />
		{/if}
		{#if topCategories.length}
			<div class="{children.length ? 'mt-5' : ''} flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
				{#each topCategories.slice(0, 12) as c (c.slug)}
					{@const active = selectedCategory === c.slug}
					<a
						href={categoryHref(c.slug)}
						aria-current={active ? 'true' : undefined}
						class="shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition {active
							? 'border-primary-checked bg-primary-checked text-white'
							: 'border-line-2 text-foreground hover:border-primary-checked'}"
					>
						{c.name}
						<span class="ms-1 {active ? 'text-white/80' : 'text-muted-foreground-1'}">{c.product_count}</span>
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/if}
{/snippet}

<CatalogPage
	bind:this={catalog}
	title={a.name}
	description={a.short_description ? escapeHtml(a.short_description) : undefined}
	heroUrl={a.image_url || undefined}
	products={data.products}
	facets={data.facets}
	params={new URLSearchParams(data.params)}
	pathname={data.pathname}
	fixedParams={{ activity: a.code }}
	categoryFilter
	categoryPool={data.allCategories}
	{breadcrumbs}
	{intro}
/>
