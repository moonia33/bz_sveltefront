<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ProductGrid from '#lib/components/shop/ProductGrid.svelte';
	import { formatMoney } from '#lib/money';
	import { Minus, Plus, ShoppingCart, Truck, Check } from '@lucide/svelte';
	import type { VariantOut } from '#lib/api/types';

	let { data, form } = $props();
	const product = $derived(data.product);
	const variants = $derived(product.variants.filter((v) => v.is_active));

	type OptionGroup = {
		code: string;
		name: string;
		values: { code: string; label: string }[];
	};

	const optionGroups = $derived.by<OptionGroup[]>(() => {
		const groups = new Map<string, OptionGroup & { seen: Set<string> }>();
		for (const v of variants) {
			for (const o of v.options) {
				let g = groups.get(o.option_type_code);
				if (!g) {
					g = {
						code: o.option_type_code,
						name: o.option_type_name,
						values: [],
						seen: new Set()
					};
					groups.set(o.option_type_code, g);
				}
				if (!g.seen.has(o.option_value_code)) {
					g.seen.add(o.option_value_code);
					g.values.push({ code: o.option_value_code, label: o.option_value_label });
				}
			}
		}
		return [...groups.values()];
	});

	let selection = $state<Record<string, string>>({});
	let qty = $state(1);
	let addedFlash = $state(false);

	function matchesAll(v: VariantOut, sel: Record<string, string>): boolean {
		return Object.entries(sel).every(
			([typeCode, valueCode]) =>
				v.options.some(
					(o) => o.option_type_code === typeCode && o.option_value_code === valueCode
				)
		);
	}

	const selectedVariant = $derived.by<VariantOut | null>(() => {
		if (!variants.length) return null;
		if (!optionGroups.length) return variants[0];
		const exact = variants.find(
			(v) =>
				v.options.length === optionGroups.length &&
				v.options.every(
					(o) => selection[o.option_type_code] === o.option_value_code
				)
		);
		if (exact) return exact;
		// Partial selection → first variant matching chosen options.
		return variants.find((v) => matchesAll(v, selection)) ?? null;
	});

	function valueAvailable(typeCode: string, valueCode: string): boolean {
		return variants.some((v) =>
			matchesAll(v, { ...selection, [typeCode]: valueCode })
		);
	}

	const images = $derived.by(() => {
		const imgs = [...(selectedVariant?.images ?? []), ...product.images];
		const seen = new Set<string>();
		return imgs.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
	});
	let activeImage = $state(0);
	const price = $derived(selectedVariant?.price ?? variants[0]?.price);
	const stock = $derived(selectedVariant?.stock_available ?? 0);

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat('lt-LT', { month: 'long', day: 'numeric' }).format(
			new Date(iso)
		);
	}
</script>

<svelte:head>
	<title>{product.seo_title || product.name} — Baltijos Žvynas</title>
	{#if product.seo_description}
		<meta name="description" content={product.seo_description} />
	{/if}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<nav class="mb-6 text-sm text-gray-500 dark:text-neutral-400" aria-label="Duonos traiškanys">
		<a href="/" class="hover:text-gray-800 dark:hover:text-neutral-200">Pradžia</a>
		<span class="mx-1">/</span>
		{#if product.category}
			<a href="/k/{product.category.slug}" class="hover:text-gray-800 dark:hover:text-neutral-200"
				>{product.category.name}</a
			>
			<span class="mx-1">/</span>
		{/if}
		<span class="text-gray-800 dark:text-neutral-200">{product.name}</span>
	</nav>

	<div class="grid grid-cols-1 gap-10 lg:grid-cols-2">
		<!-- Galerija -->
		<div class="lg:sticky lg:top-32 lg:self-start">
			<div
				class="aspect-square overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
			>
				{#if images[activeImage]}
					<img
						src={images[activeImage].url}
						alt={product.name}
						width="800"
						height="800"
						class="size-full object-contain"
					/>
				{:else}
					<div class="flex size-full items-center justify-center text-gray-300">
						<ShoppingCart class="size-16" />
					</div>
				{/if}
			</div>
			{#if images.length > 1}
				<div class="mt-3 flex gap-2 overflow-x-auto">
					{#each images as img, i (img.url)}
						<button
							type="button"
							class="size-16 shrink-0 overflow-hidden rounded-lg border {i === activeImage
								? 'border-zvynas-600'
								: 'border-gray-200 dark:border-neutral-700'}"
							onclick={() => (activeImage = i)}
							aria-label="Nuotrauka {i + 1}"
						>
							<img src={img.url} alt="" class="size-full object-cover" loading="lazy" />
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Informacija -->
		<div>
			{#if product.brand}
				<p class="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-neutral-400">
					{product.brand.name}
				</p>
			{/if}
			<h1 class="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
				{product.name}
			</h1>
			<p class="mt-1 text-sm text-gray-400">Kodas: {selectedVariant?.sku ?? product.sku}</p>

			<div class="mt-4 flex items-baseline gap-x-3">
				{#if price}
					<span class="text-3xl font-bold text-gray-900 dark:text-white">
						{formatMoney(price)}
					</span>
					{#if selectedVariant?.compare_at_price}
						<span class="text-lg text-gray-400 line-through">
							{formatMoney(selectedVariant.compare_at_price)}
						</span>
						<span
							class="rounded-full bg-zvynas-50 px-2 py-0.5 text-xs font-semibold text-zvynas-700 dark:bg-zvynas-500/10 dark:text-zvynas-400"
						>
							−{selectedVariant.discount_percent}%
						</span>
					{/if}
				{/if}
			</div>

			<p class="mt-2 text-sm">
				{#if stock > 0}
					<span class="font-medium text-green-600 dark:text-green-400">
						Sandėlyje ({stock} vnt.)
					</span>
				{:else}
					<span class="font-medium text-amber-600">Išparduota / pagal užsakymą</span>
				{/if}
			</p>

			{#if product.delivery_window}
				<p
					class="mt-2 flex items-center gap-x-1.5 text-sm text-gray-500 dark:text-neutral-400"
				>
					<Truck class="size-4" />
					Pristatymas: {fmtDate(product.delivery_window.min_date)} – {fmtDate(
						product.delivery_window.max_date
					)}
				</p>
			{/if}

			<form
				method="POST"
				action="?/add"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							addedFlash = true;
							setTimeout(() => (addedFlash = false), 3000);
							await invalidateAll();
						}
					};
				}}
				class="mt-6 space-y-4"
			>
				{#each optionGroups as group (group.code)}
					<fieldset>
						<legend class="mb-2 text-sm font-medium text-gray-700 dark:text-neutral-300">
							{group.name}
						</legend>
						<div class="flex flex-wrap gap-2">
							{#each group.values as v (v.code)}
								{@const active = selection[group.code] === v.code}
								{@const avail = valueAvailable(group.code, v.code)}
								<button
									type="button"
									disabled={!avail}
									aria-pressed={active}
									onclick={() =>
										(selection = { ...selection, [group.code]: v.code })}
									class="rounded-lg border px-3 py-2 text-sm transition {active
										? 'border-zvynas-600 bg-zvynas-50 font-semibold text-zvynas-700 dark:bg-zvynas-500/10 dark:text-zvynas-400'
										: avail
											? 'border-gray-200 text-gray-700 hover:border-gray-400 dark:border-neutral-700 dark:text-neutral-300'
											: 'cursor-not-allowed border-gray-200 text-gray-300 line-through dark:border-neutral-800 dark:text-neutral-600'}"
								>
									{v.label}
								</button>
							{/each}
						</div>
					</fieldset>
				{/each}

				<div class="flex items-center gap-3">
					<div
						class="flex items-center rounded-lg border border-gray-200 dark:border-neutral-700"
					>
						<button
							type="button"
							class="p-2.5 text-gray-500 hover:text-gray-800 disabled:opacity-40 dark:hover:text-neutral-200"
							disabled={qty <= 1}
							onclick={() => (qty = Math.max(1, qty - 1))}
							aria-label="Sumažinti kiekį"><Minus class="size-4" /></button
						>
						<span class="w-10 text-center text-sm font-medium">{qty}</span>
						<button
							type="button"
							class="p-2.5 text-gray-500 hover:text-gray-800 dark:hover:text-neutral-200"
							onclick={() => (qty += 1)}
							aria-label="Padidinti kiekį"><Plus class="size-4" /></button
						>
					</div>
					<input type="hidden" name="qty" value={qty} />
					{#if selectedVariant}
						<input type="hidden" name="variant_id" value={selectedVariant.id} />
						{#if selectedVariant.offer_id}
							<input type="hidden" name="offer_id" value={selectedVariant.offer_id} />
						{/if}
					{/if}
					<button
						type="submit"
						disabled={!selectedVariant || stock <= 0}
						class="inline-flex grow items-center justify-center gap-x-2 rounded-full bg-zvynas-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zvynas-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-neutral-700"
					>
						{#if addedFlash}
							<Check class="size-4" /> Pridėta!
						{:else}
							<ShoppingCart class="size-4" /> Į krepšelį
						{/if}
					</button>
				</div>

				{#if form?.addError}
					<p class="text-sm text-zvynas-600">{form.addError}</p>
				{/if}
			</form>

		</div>
	</div>

	<!-- Aprašymas + specifikacijos kaip accordion'ai -->
	<section class="mt-12 max-w-4xl divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white dark:divide-neutral-700 dark:border-neutral-700 dark:bg-neutral-900">
		{#if product.description}
			<details class="group" open>
				<summary
					class="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-gray-900 dark:text-white"
				>
					Aprašymas
					<span class="text-gray-400 transition group-open:rotate-180">▾</span>
				</summary>
				<div class="prose max-w-none px-5 pb-5 text-sm dark:prose-invert">
					{@html product.description}
				</div>
			</details>
		{/if}
		{#if product.features?.length}
			<details class="group" open>
				<summary
					class="flex cursor-pointer items-center justify-between px-5 py-4 font-semibold text-gray-900 dark:text-white"
				>
					Specifikacijos
					<span class="text-gray-400 transition group-open:rotate-180">▾</span>
				</summary>
				<dl class="grid grid-cols-1 gap-x-8 gap-y-1 px-5 pb-5 sm:grid-cols-2">
					{#each product.features as f (f.feature_id)}
						<div
							class="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-neutral-800"
						>
							<dt class="text-sm text-gray-500 dark:text-neutral-400">{f.feature_name}</dt>
							<dd class="text-sm font-medium text-gray-900 dark:text-white">
								{f.value_label || f.value}
							</dd>
						</div>
					{/each}
				</dl>
			</details>
		{/if}
	</section>

	{#if data.recommendations.length}
		<section class="mt-12">
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
				Pirkėjai taip pat pirko
			</h2>
			<ProductGrid products={data.recommendations} />
		</section>
	{/if}
</div>
