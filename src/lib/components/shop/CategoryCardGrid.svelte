<script lang="ts">
	import type { CategoryImageOut, CategoryOut } from '#lib/api/types';
	import CategoryImg from './CategoryImg.svelte';
	import { unit } from '#lib/i18n/units';
	import { m } from '#lib/paraglide/messages';

	let {
		categories = [],
		all = [],
		priority = false
	}: {
		categories?: CategoryOut[];
		/** Pirmos kortelės nuotrauka – LCP kandidatas (eager + high). */
		priority?: boolean;
		/** Full category list — used to count sub-categories of each card. */
		all?: CategoryOut[];
	} = $props();

	type Slot = { url: string; img: CategoryImageOut | null };
	const slot = (url?: string | null, img?: CategoryImageOut | null): Slot => ({
		url: url ?? '',
		img: img ?? null
	});
	const BIG_SIZES = '(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 60vw';
	const SMALL_SIZES = '(min-width: 1024px) 11vw, (min-width: 640px) 20vw, 40vw';
	const SINGLE_SIZES = '(min-width: 1024px) 27vw, (min-width: 640px) 50vw, 100vw';

	const childrenCount = (id: number) => all.filter((c) => c.parent_id === id).length;

	function initials(name: string): string {
		return (
			name
				.split(/\s+/)
				.filter(Boolean)
				.slice(0, 2)
				.map((w) => w[0])
				.join('')
				.toUpperCase() || '·'
		);
	}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
	{#each categories as cat, i (cat.id)}
		{@const subs = childrenCount(cat.id)}
		{@const imgs = cat.image_urls ?? []}
		{@const kids = all.filter((c) => c.parent_id === cat.id)}
		{@const big = cat.card_image_url
			? slot(cat.card_image_url, cat.card_image)
			: cat.hero_image_url
				? slot(cat.hero_image_url, cat.hero_image)
				: slot(imgs[0])}
		{@const lcp = priority && i === 0}
		<!-- Mažieji slotai: vaikų card_image → hero → card → prekės.
		     menu_icon kortelėse nenaudojam (sustiprintas tik meniu). -->
		{@const smallPool = [
			...kids.map((k) =>
				k.card_image_url ? slot(k.card_image_url, k.card_image) : slot(k.image_urls?.[0])
			),
			slot(cat.hero_image_url, cat.hero_image),
			slot(cat.card_image_url, cat.card_image),
			...imgs.map((u) => slot(u))
		].filter((x, j, arr) => x.url !== '' && x.url !== big.url && arr.findIndex((y) => y.url === x.url) === j)}
		{@const smallImgs = smallPool.slice(0, 2)}
		<a
			href="/k/{cat.slug}"
			class="group block rounded-xl border border-layer-line bg-layer p-2 pb-4 transition-[box-shadow,transform] duration-150 hover:shadow-md focus:outline-hidden focus:shadow-md motion-safe:active:scale-[0.98]"
		>
			<div class="relative overflow-hidden rounded-lg bg-surface">
				{#if big.url && smallImgs.length > 0}
					<div class="grid aspect-[5/4] w-full grid-cols-[3fr_2fr] gap-0.5">
						<CategoryImg
							image={big.img}
							src={big.url}
							alt={cat.name}
							width={560}
							height={448}
							sizes={BIG_SIZES}
							priority={lcp}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<div class="grid grid-rows-2 gap-0.5">
							{#each smallImgs as u (u.url)}
								<div class="relative min-h-0">
									<CategoryImg
										image={u.img}
										src={u.url}
										alt=""
										width={300}
										height={300}
										sizes={SMALL_SIZES}
										eager={lcp}
										class="absolute inset-0 h-full w-full object-cover"
									/>
								</div>
							{/each}
							{#if smallImgs.length < 2}
								<div
									class="relative flex items-center justify-center bg-linear-to-br from-primary-800 to-primary-950 font-semibold text-xl text-white"
								>
									{initials(cat.name)}
								</div>
							{/if}
						</div>
					</div>
				{:else if big.url}
					<CategoryImg
						image={big.img}
						src={big.url}
						alt={cat.name}
						width={560}
						height={560}
						sizes={SINGLE_SIZES}
						priority={lcp}
						class="aspect-square w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-105 group-focus:scale-105"
					/>
				{:else}
					<div
						class="flex aspect-square w-full items-center justify-center bg-linear-to-br from-primary-800 to-primary-950"
					>
						<span class="font-semibold text-3xl text-white">{initials(cat.name)}</span>
					</div>
				{/if}
			</div>
			<p
				class="mt-3 text-center font-medium text-foreground group-hover:text-primary-hover group-focus:text-primary-focus"
			>
				{cat.name}
			</p>
			{#if subs}
				<p class="mt-2 text-center text-sm text-muted-foreground-1">
					{subs}
					{unit('subcategory', subs)}
				</p>
			{/if}
			<p class="mt-2 text-center">
				<span
					class="inline-flex items-center gap-x-1 text-xs font-medium underline underline-offset-4 text-muted-foreground-1 group-hover:text-primary-hover group-focus:text-primary-focus"
				>
					{m.cat_view_all()}
				</span>
			</p>
		</a>
	{/each}
</div>
