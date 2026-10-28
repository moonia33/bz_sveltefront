<script lang="ts">
	import { Check, ChevronDown, X } from '@lucide/svelte';
	import type { CatalogFacetsOut } from '#lib/api/types';
	import Overlay from '#lib/components/ui/Overlay.svelte';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';

	let {
		facets,
		params,
		open = $bindable(false),
		categoryLinks = []
	}: {
		facets: CatalogFacetsOut;
		params: URLSearchParams;
		open?: boolean;
		categoryLinks?: { slug: string; name: string }[];
	} = $props();

	const selectedFeatures = $derived(new Set((params.get('feature') ?? '').split(',').filter(Boolean)));
	const selectedOptions = $derived(new Set((params.get('option') ?? '').split(',').filter(Boolean)));
	const brandSlug = $derived(params.get('brand_slug') ?? '');
	const groupCode = $derived(params.get('group_code') ?? '');
	const inStock = $derived(params.get('in_stock_only') === '1');
	const q = $derived(params.get('q') ?? '');

	// F4: `range=code:min-max[,;code2:min2-max2]` — numeric range facets.
	interface RangeSel {
		min: string;
		max: string;
	}
	const selectedRanges = $derived.by(() => {
		const map = new Map<string, RangeSel>();
		for (const part of (params.get('range') ?? '').split(/[;,]/)) {
			const i = part.indexOf(':');
			if (i < 0) continue;
			const code = part.slice(0, i).trim();
			if (!code) continue;
			const [lo = '', hi = ''] = part.slice(i + 1).split('-');
			map.set(code, { min: lo.trim(), max: hi.trim() });
		}
		return map;
	});

	// Per-facet input drafts for range widgets (populated on input; an
	// absent key means "no edits yet" — falls back to the active value).
	let rangeDrafts = $state<Record<string, RangeSel>>({});

	function setRangeDraft(code: string, field: 'min' | 'max', v: string) {
		const cur = selectedRanges.get(code);
		const d = rangeDrafts[code] ?? { min: cur?.min ?? '', max: cur?.max ?? '' };
		d[field] = v;
		rangeDrafts[code] = d;
	}

	function rangeDraft(code: string): RangeSel {
		return rangeDrafts[code] ?? selectedRanges.get(code) ?? { min: '', max: '' };
	}

	function _writeRanges(p: URLSearchParams, map: Map<string, RangeSel>) {
		const s = [...map].map(([k, v]) => `${k}:${v.min}-${v.max}`).join(',');
		if (s) p.set('range', s);
		else p.delete('range');
	}

	function applyRangeHref(code: string): string {
		const d = rangeDraft(code);
		const map = new Map(selectedRanges);
		const min = d.min.trim();
		const max = d.max.trim();
		if (min || max) map.set(code, { min, max });
		else map.delete(code);
		return href((p) => _writeRanges(p, map));
	}

	function removeRangeHref(code: string): string {
		const map = new Map(selectedRanges);
		map.delete(code);
		return href((p) => _writeRanges(p, map));
	}

	let expanded = $state(new Set<string>());

	function href(mut: (p: URLSearchParams) => void): string {
		const p = new URLSearchParams(params);
		p.delete('page');
		mut(p);
		const s = p.toString();
		return `?${s}`;
	}

	function togglePair(param: string, selected: Set<string>, code: string, value: string): string {
		const key = `${code}:${value}`;
		const set = new Set(selected);
		if (set.has(key)) set.delete(key);
		else set.add(key);
		return href((p) => {
			if (set.size) p.set(param, [...set].join(','));
			else p.delete(param);
		});
	}

	function removePair(param: string, selected: Set<string>, key: string): string {
		const set = new Set(selected);
		set.delete(key);
		return href((p) => {
			if (set.size) p.set(param, [...set].join(','));
			else p.delete(param);
		});
	}

	interface Chip {
		label: string;
		href: string;
	}

	const chips = $derived.by(() => {
		const list: Chip[] = [];
		if (brandSlug) {
			const b = facets.brands.find((x) => x.slug === brandSlug);
			list.push({
				label: `Gamintojas: ${b?.name ?? brandSlug}`,
				href: href((p) => p.delete('brand_slug'))
			});
		}
		if (groupCode) {
			const g = facets.product_groups.find((x) => x.code === groupCode);
			list.push({
				label: `Grupė: ${g?.name ?? groupCode}`,
				href: href((p) => p.delete('group_code'))
			});
		}
		if (inStock) {
			list.push({
				label: 'Tik turimos sandėlyje',
				href: href((p) => p.delete('in_stock_only'))
			});
		}
		for (const key of selectedFeatures) {
			const [code, value] = key.split(':');
			const f = facets.features.find((x) => x.code === code);
			const v = f?.values.find((x) => x.value === value);
			list.push({
				label: `${f?.name ?? code}: ${v?.label ?? v?.value ?? value}`,
				href: removePair('feature', selectedFeatures, key)
			});
		}
		for (const key of selectedOptions) {
			const [code, value] = key.split(':');
			const t = facets.option_types.find((x) => x.code === code);
			const v = t?.values?.find((x) => x.code === value);
			list.push({
				label: `${t?.name ?? code}: ${v?.label ?? value}`,
				href: removePair('option', selectedOptions, key)
			});
		}
		for (const [code, sel] of selectedRanges) {
			const f =
				facets.features.find((x) => x.code === code) ??
				facets.option_types.find((x) => x.code === code);
			const unit = f?.unit ? ` ${f.unit}` : '';
			list.push({
				label: `${f?.name ?? code}: ${sel.min || '…'}–${sel.max || '…'}${unit}`,
				href: removeRangeHref(code)
			});
		}
		if (q) {
			list.push({ label: `Paieška: „${q}“`, href: href((p) => p.delete('q')) });
		}
		return list;
	});

	const clearAll = $derived(
		href((p) => {
			for (const k of ['brand_slug', 'group_code', 'feature', 'option', 'range', 'in_stock_only', 'q'])
				p.delete(k);
		})
	);

	const cssColor = /^#|^rgb|^[a-z]+$/i;
	const isSwatch = (t: { display_type?: string; swatch_type?: string | null }) =>
		!!t.swatch_type || /swatch|color/i.test(t.display_type ?? '');

	function toggleExpanded(key: string) {
		const next = new Set(expanded);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		expanded = next;
	}
</script>

{#snippet row(h: string, selected: boolean, label: string)}
	<div class="flex items-center">
		<a
			href={h}
			data-sveltekit-noscroll
			data-sveltekit-keepfocus
			rel="nofollow"
			aria-current={selected ? 'true' : undefined}
			class="p-2 group w-full inline-flex items-center text-sm rounded-lg hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
		>
			<span
				class="shrink-0 size-4 rounded-sm border border-line-3 inline-flex items-center justify-center {selected
					? 'bg-primary border-primary text-primary-foreground'
					: 'bg-transparent'}"
			>
				{#if selected}<Check class="size-3" />{/if}
			</span>
			<span class="ms-2 text-foreground">{label}</span>
		</a>
	</div>
{/snippet}

{#snippet rangeFacet(code: string, name: string, lo: number | null | undefined, hi: number | null | undefined, unit: string | undefined)}
	{@const d = rangeDraft(code)}
	<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
		<div class="mb-3">
			<span class="font-medium text-sm text-foreground">{name}</span>
		</div>
		<div class="flex items-center gap-1.5">
			<input
				type="number"
				inputmode="decimal"
				step="any"
				min={lo ?? undefined}
				max={hi ?? undefined}
				placeholder={lo != null ? String(lo) : 'min'}
				aria-label="{name} – nuo"
				value={d.min}
				oninput={(e) => setRangeDraft(code, 'min', e.currentTarget.value)}
				class="w-full min-w-0 py-1.5 px-2 text-sm rounded-lg border border-layer-line bg-transparent text-foreground focus:outline-hidden focus:border-line-3"
			/>
			<span class="shrink-0 text-muted-foreground-1">–</span>
			<input
				type="number"
				inputmode="decimal"
				step="any"
				min={lo ?? undefined}
				max={hi ?? undefined}
				placeholder={hi != null ? String(hi) : 'max'}
				aria-label="{name} – iki"
				value={d.max}
				oninput={(e) => setRangeDraft(code, 'max', e.currentTarget.value)}
				class="w-full min-w-0 py-1.5 px-2 text-sm rounded-lg border border-layer-line bg-transparent text-foreground focus:outline-hidden focus:border-line-3"
			/>
			{#if unit}
				<span class="shrink-0 text-xs text-muted-foreground-1">{unit}</span>
			{/if}
			<a
				href={applyRangeHref(code)}
				data-sveltekit-noscroll
				data-sveltekit-keepfocus
				rel="nofollow"
				class="shrink-0 py-1.5 px-2.5 text-xs rounded-lg border border-layer-line text-layer-foreground hover:border-line-3 focus:outline-hidden focus:border-line-3"
				>Taikyti</a
			>
		</div>
	</div>
{/snippet}

{#snippet moreButton(key: string, total: number)}
	{#if total > 8}
		<div class="mt-1">
			<button
				type="button"
				onclick={() => toggleExpanded(key)}
				class="inline-flex items-center gap-x-1.5 text-[13px] text-foreground underline underline-offset-4 hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
			>
				{expanded.has(key) ? 'Rodyti mažiau' : `Rodyti daugiau (${total - 8})`}
				<ChevronDown
					class="shrink-0 size-3.5 transition-transform {expanded.has(key) ? 'rotate-180' : ''}"
				/>
			</button>
		</div>
	{/if}
{/snippet}

{#snippet content()}
	<div class="p-5 lg:pt-10 lg:ps-0">
		{#if chips.length}
			<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
				<div class="mb-3 flex items-center justify-between gap-x-2">
					<span class="font-medium text-sm text-foreground">Pritaikyti filtrai</span>
					<a
						href={clearAll}
						data-sveltekit-noscroll
						class="text-xs text-muted-foreground-1 underline underline-offset-4 hover:text-foreground"
						>Išvalyti viską</a
					>
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each chips as chip (chip.label)}
						<span
							class="p-1 ps-2 inline-flex items-center gap-1.5 bg-surface text-surface-foreground text-sm rounded-lg"
						>
							{chip.label}
							<a
								href={chip.href}
								data-sveltekit-noscroll
								data-sveltekit-keepfocus
								rel="nofollow"
								aria-label="Pašalinti filtrą {chip.label}"
								class="inline-flex shrink-0 justify-center items-center size-5 rounded-md text-muted-foreground-2 hover:bg-surface-hover focus:outline-hidden focus:bg-surface-focus"
							>
								<X class="shrink-0 size-4" />
							</a>
						</span>
					{/each}
				</div>
			</div>
		{/if}

		{#if categoryLinks.length}
			<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
				<div class="mb-3">
					<span class="font-medium text-sm text-foreground">Kategorijos</span>
				</div>
				<div class="space-y-0.5">
					{#each categoryLinks as c (c.slug)}
						<div class="flex items-center">
							<a
								href="/k/{c.slug}"
								class="p-2 w-full inline-flex items-center text-sm rounded-lg text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
								>{c.name}</a
							>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if facets.brands?.length}
			{@const shown = expanded.has('brands') ? facets.brands : facets.brands.slice(0, 8)}
			<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
				<div class="mb-3">
					<span class="font-medium text-sm text-foreground">Gamintojas</span>
				</div>
				<div class="space-y-0.5">
					{#each shown as b (b.id)}
						{@render row(
							brandSlug === b.slug
								? href((p) => p.delete('brand_slug'))
								: href((p) => p.set('brand_slug', b.slug)),
							brandSlug === b.slug,
							b.name
						)}
					{/each}
				</div>
				{@render moreButton('brands', facets.brands.length)}
			</div>
		{/if}

		{#if facets.product_groups?.length}
			{@const groups = expanded.has('groups')
				? facets.product_groups
				: facets.product_groups.slice(0, 8)}
			<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
				<div class="mb-3">
					<span class="font-medium text-sm text-foreground">Prekių grupė</span>
				</div>
				<div class="space-y-0.5">
					{#each groups as g (g.id)}
						{@render row(
							groupCode === g.code
								? href((p) => p.delete('group_code'))
								: href((p) => p.set('group_code', g.code)),
							groupCode === g.code,
							g.name
						)}
					{/each}
				</div>
				{@render moreButton('groups', facets.product_groups.length)}
			</div>
		{/if}

		<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
			<div class="mb-3">
				<span class="font-medium text-sm text-foreground">Prieinamumas</span>
			</div>
			<div class="space-y-0.5">
				{@render row(
					inStock
						? href((p) => p.delete('in_stock_only'))
						: href((p) => p.set('in_stock_only', '1')),
					inStock,
					'Tik turimos sandėlyje'
				)}
			</div>
		</div>

		{#each facets.features as f (f.id)}
			{#if f.widget === 'range'}
				{@render rangeFacet(f.code, f.name ?? f.code, f.min, f.max, f.unit)}
			{:else if f.values?.length}
				{@const key = `feature-${f.code}`}
				{@const shown = expanded.has(key) ? f.values : f.values.slice(0, 8)}
				<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
					<div class="mb-3">
						<span class="font-medium text-sm text-foreground">{f.name}</span>
					</div>
					<div class="space-y-0.5">
						{#each shown as v (v.id)}
							{@render row(
								togglePair('feature', selectedFeatures, f.code, v.value),
								selectedFeatures.has(`${f.code}:${v.value}`),
								v.label || v.value
							)}
						{/each}
					</div>
					{@render moreButton(key, f.values.length)}
				</div>
			{/if}
		{/each}

		{#each facets.option_types as t (t.id)}
			{#if t.widget === 'range'}
				{@render rangeFacet(t.code, t.name ?? t.code, t.min, t.max, t.unit)}
			{:else if t.values?.length}
				{@const key = `option-${t.code}`}
				{@const shown = expanded.has(key) ? t.values : t.values.slice(0, 8)}
				<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
					<div class="mb-3">
						<span class="font-medium text-sm text-foreground">{t.name ?? t.code}</span>
					</div>
					{#if isSwatch(t)}
						<div class="flex flex-wrap gap-2 px-1">
							{#each shown as v (v.id)}
								{@const selected = selectedOptions.has(`${t.code}:${v.code}`)}
								{#if cssColor.test(v.code)}
									<a
										href={togglePair('option', selectedOptions, t.code, v.code)}
										data-sveltekit-noscroll
										data-sveltekit-keepfocus
										rel="nofollow"
										title={v.label}
										aria-label="{v.label}{selected ? ' (pasirinkta)' : ''}"
										aria-current={selected ? 'true' : undefined}
										class="size-7 rounded-full border border-line-3 ring-2 ring-offset-2 ring-offset-background {selected
											? 'ring-primary'
											: 'ring-transparent hover:ring-line-3'}"
										style="background: {v.code}"
									></a>
								{:else}
									<a
										href={togglePair('option', selectedOptions, t.code, v.code)}
										data-sveltekit-noscroll
										data-sveltekit-keepfocus
										rel="nofollow"
										aria-current={selected ? 'true' : undefined}
										class="py-1 px-2.5 inline-flex items-center text-xs rounded-full border {selected
											? 'border-primary text-primary-checked ring-1 ring-primary-checked'
											: 'border-layer-line text-layer-foreground hover:border-line-3'}"
										>{v.label}</a
									>
								{/if}
							{/each}
						</div>
					{:else}
						<div class="mx-px flex flex-wrap gap-2">
							{#each shown as v (v.id)}
								{@const selected = selectedOptions.has(`${t.code}:${v.code}`)}
								<a
									href={togglePair('option', selectedOptions, t.code, v.code)}
									data-sveltekit-noscroll
									data-sveltekit-keepfocus
									rel="nofollow"
									aria-current={selected ? 'true' : undefined}
									class="p-2.5 inline-flex justify-center items-center text-center text-xs border rounded-lg {selected
										? 'text-primary-checked border-primary-checked ring-1 ring-primary-checked'
										: 'border-layer-line text-layer-foreground hover:border-line-3'}"
									>{v.label}</a
								>
							{/each}
						</div>
					{/if}
					{@render moreButton(key, t.values.length)}
				</div>
			{/if}
		{/each}

		<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
			<div class="mb-3">
				<span class="font-medium text-sm text-foreground">Kaina</span>
			</div>
			<MissingFeature
				feature="Kainos intervalo filtras"
				endpoint="min_price/max_price @ /catalog/products"
			/>
		</div>

		<div class="pb-6 mb-6 border-b border-sidebar-divider last:pb-0 last:mb-0 last:border-b-0">
			<div class="mb-3">
				<span class="font-medium text-sm text-foreground">Įvertinimas</span>
			</div>
			<MissingFeature feature="Atsiliepimai/įvertinimai" />
		</div>
	</div>
{/snippet}

<!-- Desktop: statinis sidebar -->
<aside
	class="hidden lg:block lg:w-72 lg:shrink-0 lg:pe-8 border-e border-sidebar-line bg-sidebar"
	aria-label="Filtrai"
>
	{@render content()}
</aside>

<!-- Mobile: overlay -->
<Overlay
	bind:open
	side="start"
	label="Filtrai"
	panelClass="overflow-y-auto border-e border-sidebar-line"
>
	<div class="py-3 px-5 flex justify-between items-center gap-x-3 border-b border-sidebar-divider">
		<span class="font-medium text-foreground">Filtrai</span>
		<button
			type="button"
			onclick={() => (open = false)}
			class="size-6 inline-flex justify-center items-center gap-x-2 rounded-full bg-surface border border-surface-line text-surface-foreground hover:bg-surface-hover focus:outline-hidden"
			aria-label="Uždaryti filtrus"
		>
			<X class="shrink-0 size-4" />
		</button>
	</div>
	{@render content()}
</Overlay>
