<script lang="ts">
	import type { CatalogFacetsOut } from '#lib/api/types';

	let {
		facets,
		params
	}: {
		facets: CatalogFacetsOut;
		params: URLSearchParams;
	} = $props();

	const selectedFeatures = $derived(new Set((params.get('feature') ?? '').split(',').filter(Boolean)));
	const brandSlug = $derived(params.get('brand_slug') ?? '');

	function href(mut: (p: URLSearchParams) => void): string {
		const p = new URLSearchParams(params);
		p.delete('page');
		mut(p);
		const s = p.toString();
		return `?${s}`;
	}

	function toggleFeature(code: string, value: string): string {
		const key = `${code}:${value}`;
		const set = new Set(selectedFeatures);
		if (set.has(key)) set.delete(key);
		else set.add(key);
		return href((p) => {
			if (set.size) p.set('feature', [...set].join(','));
			else p.delete('feature');
		});
	}
</script>

<aside class="w-full space-y-6 lg:w-64 lg:shrink-0">
	{#if facets.brands?.length}
		<div>
			<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Gamintojas</h3>
			<ul class="space-y-1">
				<li>
					<a
						href={href((p) => p.delete('brand_slug'))}
						class="block rounded-lg px-2 py-1 text-sm {!brandSlug
							? 'font-semibold text-zvynas-600'
							: 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}"
						>Visi</a
					>
				</li>
				{#each facets.brands as b (b.id)}
					<li>
						<a
							href={href((p) => p.set('brand_slug', b.slug))}
							class="block rounded-lg px-2 py-1 text-sm {brandSlug === b.slug
								? 'font-semibold text-zvynas-600'
								: 'text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800'}"
							>{b.name}</a
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div>
		<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Prieinamumas</h3>
		<label class="flex items-center gap-x-2 px-2 py-1 text-sm text-gray-600 dark:text-neutral-300">
			<a
				href={href((p) =>
					p.get('in_stock_only') === '1'
						? p.delete('in_stock_only')
						: p.set('in_stock_only', '1')
				)}
				class="flex items-center gap-x-2"
			>
				<input
					type="checkbox"
					readonly
					tabindex={-1}
					checked={params.get('in_stock_only') === '1'}
					class="pointer-events-none rounded border-gray-300 text-zvynas-600"
				/>
				Tik sandėlyje
			</a>
		</label>
	</div>

	{#each facets.features as f (f.id)}
		{#if f.values?.length}
			<div>
				<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">{f.name}</h3>
				<ul class="space-y-1">
					{#each f.values as v (v.id)}
						{@const key = `${f.code}:${v.value}`}
						<li>
							<a
								href={toggleFeature(f.code, v.value)}
								class="flex items-center gap-x-2 rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
							>
								<input
									type="checkbox"
									readonly
									tabindex={-1}
									checked={selectedFeatures.has(key)}
									class="pointer-events-none rounded border-gray-300 text-zvynas-600"
								/>
								{v.label || v.value}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/each}
</aside>
