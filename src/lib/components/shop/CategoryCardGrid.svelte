<script lang="ts">
	import type { CategoryOut } from '#lib/api/types';
	import { unit } from '#lib/i18n/units';

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

<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
	{#each categories as cat (cat.id)}
		{@const subs = childrenCount(cat.id)}
		{@const imgs = cat.image_urls ?? []}
		{@const img = cat.hero_image_url ?? imgs[0] ?? cat.menu_icon_url}
		<a href="/k/{cat.slug}" class="group block focus:outline-hidden">
			<div class="overflow-hidden rounded-xl bg-surface">
				{#if !cat.hero_image_url && imgs.length >= 3}
					<div class="grid aspect-[5/4] w-full grid-cols-[3fr_2fr] gap-0.5">
						<img
							src={imgs[0]}
							alt={cat.name}
							width="560"
							height="448"
							loading="lazy"
							decoding="async"
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
						/>
						<div class="grid grid-rows-2 gap-0.5">
							{#each imgs.slice(1, 3) as u (u)}
								<img
									src={u}
									alt=""
									width="370"
									height="224"
									loading="lazy"
									decoding="async"
									class="h-full w-full object-cover"
								/>
							{/each}
						</div>
					</div>
				{:else if img}
					<img
						src={img}
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
				class="mt-3 font-medium text-foreground group-hover:text-primary-hover group-focus:text-primary-focus"
			>
				{cat.name}
			</p>
			{#if subs}
				<p class="mt-0.5 text-sm text-muted-foreground-1">
					{subs}
					{unit('subcategory', subs)}
				</p>
			{/if}
		</a>
	{/each}
</div>
