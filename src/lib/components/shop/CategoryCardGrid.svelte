<script lang="ts">
	import type { CategoryOut } from '#lib/api/types';
	import { unit } from '#lib/i18n/units';
	import { m } from '#lib/paraglide/messages';

	let {
		categories = [],
		all = []
	}: {
		categories?: CategoryOut[];
		/** Full category list — used to count sub-categories of each card. */
		all?: CategoryOut[];
	} = $props();

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
	{#each categories as cat (cat.id)}
		{@const subs = childrenCount(cat.id)}
		{@const imgs = cat.image_urls ?? []}
		{@const kids = all.filter((c) => c.parent_id === cat.id)}
		{@const bigImg = cat.card_image_url ?? cat.hero_image_url ?? imgs[0]}
		<!-- Mažieji slotai: vaikų card_image → hero → card → prekės.
		     menu_icon kortelėse nenaudojam (sustiprintas tik meniu). -->
		{@const smallPool = [
			...kids.map((k) => k.card_image_url ?? k.image_urls?.[0] ?? ''),
			cat.hero_image_url ?? '',
			cat.card_image_url ?? '',
			...imgs
		].filter((u) => u !== '' && u !== bigImg)}
		{@const smallImgs = smallPool.slice(0, 2)}
		<a
			href="/k/{cat.slug}"
			class="group block rounded-xl border border-layer-line bg-layer p-2 pb-4 transition-shadow hover:shadow-md focus:outline-hidden focus:shadow-md"
		>
			<div class="relative overflow-hidden rounded-lg bg-surface">
				{#if bigImg && smallImgs.length > 0}
					<div class="grid aspect-[5/4] w-full grid-cols-[3fr_2fr] gap-0.5">
						<img
							src={bigImg}
							alt={cat.name}
							width="560"
							height="448"
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<div class="grid grid-rows-2 gap-0.5">
							{#each smallImgs as u (u)}
								<div class="relative min-h-0">
									<img
										src={u}
										alt=""
										loading="lazy"
										decoding="async"
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
				{:else if bigImg}
					<img
						src={bigImg}
						alt={cat.name}
						width="560"
						height="560"
						loading="lazy"
						decoding="async"
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
