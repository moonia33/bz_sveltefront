<script lang="ts">
	import ActivityTiles from '#lib/components/shop/ActivityTiles.svelte';
	import { lh } from '#lib/i18n/instance';
	import { m } from '#lib/paraglide/messages';

	let { data } = $props();
	const title = $derived(`${m.act_index_title()} — Baltijos Žvynas`);
	const description = $derived(m.act_index_meta());
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${data.origin}${data.pathname}`} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
</svelte:head>

<div class="pt-6 pb-14 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<nav aria-label={m.breadcrumb_aria()} class="text-sm text-muted-foreground-1">
		<a href={lh('/')} class="hover:text-foreground">{m.ui_home()}</a>
		<span class="mx-1.5">/</span>
		<span class="text-foreground">{m.nav_activities()}</span>
	</nav>
	<h1 class="mt-3 font-semibold text-2xl md:text-3xl text-foreground">{m.act_index_title()}</h1>
	<p class="mt-2 max-w-2xl text-muted-foreground-1">
		{m.act_index_lead()}
	</p>

	{#each data.areas as area (area.code)}
		<section class="mt-10">
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="font-medium text-lg md:text-xl text-foreground">
					<a href={lh(`/veiklos/${area.code}`)} class="hover:underline underline-offset-4"
						>{area.name}</a
					>
				</h2>
				<a
					href={lh(`/veiklos/${area.code}`)}
					class="text-sm text-muted-foreground-1 hover:text-foreground"
				>
					{m.act_all_products({ count: area.product_count })}
				</a>
			</div>
			<ActivityTiles class="mt-4" activities={area.children.filter((c) => c.visible)} />
		</section>
	{:else}
		<p class="mt-10 text-muted-foreground-1">{m.act_empty()}</p>
	{/each}
</div>
