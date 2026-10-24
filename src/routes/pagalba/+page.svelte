<script lang="ts">
	import {
		ChevronRight,
		CircleHelp,
		FileText,
		Info,
		MapPin,
		Package,
		Truck,
		Undo2,
		Wallet
	} from '@lucide/svelte';
	import type { Component } from 'svelte';

	let { data } = $props();
	const categories = $derived(data.categories ?? []);

	// CmsCategory.icon — Lucide vardo laukas admin'e; fallback Info.
	const icons: Record<string, Component> = {
		truck: Truck,
		package: Package,
		undo2: Undo2,
		'rotate-ccw': Undo2,
		wallet: Wallet,
		'credit-card': Wallet,
		info: Info,
		'file-text': FileText,
		'map-pin': MapPin,
		'circle-help': CircleHelp
	};
	function iconFor(slug: string): Component {
		return icons[(slug || '').toLowerCase()] ?? Info;
	}
</script>

<svelte:head>
	<title>Pagalba — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
	<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
		<CircleHelp class="size-6" /> Pagalbos centras
	</h1>
	<p class="mt-1 text-sm text-muted-foreground-1">
		Atsakymai į dažniausius klausimus — pristatymas, grąžinimai, mokėjimai, paskyra.
	</p>

	<div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each categories as c (c.slug)}
			{@const Icon = iconFor(c.icon)}
			<a
				href="/pagalba/{c.slug}"
				class="group flex items-start gap-x-4 rounded-xl border border-card-line bg-card p-5 transition-colors hover:border-primary/40 hover:bg-layer-hover"
			>
				<span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
					<Icon class="size-5 text-primary" />
				</span>
				<div class="min-w-0">
					<p class="font-semibold text-foreground">{c.name || c.slug}</p>
					{#if c.description}
						<p class="mt-1 line-clamp-2 text-sm text-muted-foreground-1">{c.description}</p>
					{/if}
					<p class="mt-1 text-xs text-muted-foreground">{c.page_count} straipsniai</p>
				</div>
				<ChevronRight class="ml-auto mt-1 size-4 shrink-0 text-muted-foreground-1" />
			</a>
		{:else}
			<div
				class="col-span-full rounded-xl border border-dashed border-layer-line py-16 text-center"
			>
				<p class="text-sm text-muted-foreground-1">
					Pagalbos straipsnių dar nėra — administravime sukurkite CMS kategorijas ir
					puslapius.
				</p>
			</div>
		{/each}
	</div>

	<!-- Greitosios nuorodos -->
	<div class="mt-10">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground-1">
			Greitosios nuorodos
		</h2>
		<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
			<a
				href="/parduotuves"
				class="rounded-xl border border-card-line bg-card p-4 hover:bg-layer-hover"
			>
				<p class="flex items-center gap-x-2 text-sm font-medium text-foreground">
					<MapPin class="size-4 text-primary" /> Parduotuvės
				</p>
				<p class="mt-1 text-xs text-muted-foreground-1">Adresai ir darbo laikas</p>
			</a>
			<a
				href="/grazinimas"
				class="rounded-xl border border-card-line bg-card p-4 hover:bg-layer-hover"
			>
				<p class="flex items-center gap-x-2 text-sm font-medium text-foreground">
					<Undo2 class="size-4 text-primary" /> Keitimas ir grąžinimas
				</p>
				<p class="mt-1 text-xs text-muted-foreground-1">Taisyklės ir instrukcijos</p>
			</a>
			<a
				href="/paskyra/grazinimai"
				class="rounded-xl border border-card-line bg-card p-4 hover:bg-layer-hover"
			>
				<p class="flex items-center gap-x-2 text-sm font-medium text-foreground">
					<FileText class="size-4 text-primary" /> Mano grąžinimai
				</p>
				<p class="mt-1 text-xs text-muted-foreground-1">RMA būsenos (reikalingas prisijungimas)</p>
			</a>
		</div>
	</div>
</div>
