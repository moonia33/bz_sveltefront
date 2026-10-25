<script lang="ts">
	import { ChevronRight, PanelLeft } from '@lucide/svelte';
	import CategoryNav from '#lib/components/shop/CategoryNav.svelte';
	import CategoryCardGrid from '#lib/components/shop/CategoryCardGrid.svelte';
	import { jsonLd } from '#lib/seo';

	let { data } = $props();

	let navOpen = $state(false);

	const title = 'Kategorijos — Baltijos Žvynas';
	const description = 'Visos žvejybos prekių kategorijos.';
	const canonical = $derived(`${data.origin}${data.pathname}`);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				{ '@type': 'ListItem', position: 2, name: 'Kategorijos', item: canonical }
			]
		})
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	<meta name="robots" content="index,follow" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={canonical} />
	{@html breadcrumbLd}
</svelte:head>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="grid grid-cols-1 lg:grid-cols-12">
		<div class="lg:col-span-3 lg:-ms-2.5 lg:pe-8">
			<CategoryNav all={data.all} bind:open={navOpen} />
		</div>

		<div class="lg:col-span-9">
			<!-- Mobile: sidebar trigger -->
			<div class="pt-5 lg:hidden flex justify-end">
				<button
					type="button"
					onclick={() => (navOpen = true)}
					aria-label="Atidaryti kategorijas"
					class="inline-flex items-center gap-x-2 py-1.5 px-3 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus"
				>
					<PanelLeft class="shrink-0 size-4" />
					Kategorijos
				</button>
			</div>

			<div class="pt-4 lg:pt-10">
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
							<span class="text-foreground">Kategorijos</span>
						</li>
					</ol>
				</nav>

				<h1 class="font-medium text-xl md:text-2xl text-foreground">Visos kategorijos</h1>

				<div class="py-10 lg:py-14">
					<CategoryCardGrid categories={data.roots} all={data.all} />
				</div>
			</div>
		</div>
	</div>
</div>
