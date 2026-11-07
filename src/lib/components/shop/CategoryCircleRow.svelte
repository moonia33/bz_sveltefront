<script lang="ts">
	import type { CategoryOut } from '#lib/api/types';

	let {
		categories = []
	}: {
		categories?: CategoryOut[];
	} = $props();

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

<div class="flex flex-wrap justify-center gap-x-6 gap-y-4">
	{#each categories as cat (cat.id)}
		{@const img = cat.card_image_url ?? cat.hero_image_url ?? cat.image_urls?.[0] ?? cat.menu_icon_url}
		<a href="/k/{cat.slug}" class="group w-24 sm:w-28 text-center focus:outline-hidden">
			<div
				class="mx-auto size-20 sm:size-24 overflow-hidden rounded-full border border-layer-line bg-surface p-0.5 transition-shadow group-hover:shadow-md group-focus:shadow-md"
			>
				{#if img}
					<img
						src={img}
						alt={cat.name}
						width="192"
						height="192"
						loading="lazy"
						decoding="async"
						class="h-full w-full rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				{:else}
					<span class="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-primary-800 to-primary-950 text-lg font-semibold text-white">
						{initials(cat.name)}
					</span>
				{/if}
			</div>
			<p class="mt-2 text-xs sm:text-sm text-foreground group-hover:text-primary-hover group-focus:text-primary-focus">
				{cat.name}
			</p>
		</a>
	{/each}
</div>
