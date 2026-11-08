<script lang="ts">
	import ActivityTiles from '#lib/components/shop/ActivityTiles.svelte';

	let { data } = $props();
	const title = 'Prekės pagal veiklą — Baltijos Žvynas';
	const description =
		'Karpinė, spiningas, plūdinė, feeder, stovyklavimas ir kitos veiklos: viskas, ko reikia, vienoje vietoje.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={`${data.origin}${data.pathname}`} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
</svelte:head>

<div class="pt-6 pb-14 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<nav aria-label="Breadcrumb" class="text-sm text-muted-foreground-1">
		<a href="/" class="hover:text-foreground">Pradžia</a>
		<span class="mx-1.5">/</span>
		<span class="text-foreground">Veiklos</span>
	</nav>
	<h1 class="mt-3 font-semibold text-2xl md:text-3xl text-foreground">Prekės pagal veiklą</h1>
	<p class="mt-2 max-w-2xl text-muted-foreground-1">
		Pasirink, kaip žvejoji ar ilsiesi, ir matysi tik tam tinkamas prekes su savais filtrais.
	</p>

	{#each data.areas as area (area.code)}
		<section class="mt-10">
			<div class="flex items-baseline justify-between gap-3">
				<h2 class="font-medium text-lg md:text-xl text-foreground">
					<a href={`/veiklos/${area.code}`} class="hover:underline underline-offset-4">{area.name}</a>
				</h2>
				<a href={`/veiklos/${area.code}`} class="text-sm text-muted-foreground-1 hover:text-foreground">
					Visos {area.product_count} prekės
				</a>
			</div>
			<ActivityTiles class="mt-4" activities={area.children.filter((c) => c.visible)} />
		</section>
	{:else}
		<p class="mt-10 text-muted-foreground-1">Veiklų kol kas nėra.</p>
	{/each}
</div>
