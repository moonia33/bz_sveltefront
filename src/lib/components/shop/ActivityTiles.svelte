<script lang="ts">
	import type { ActivityOut } from '#lib/api/types';

	let { activities, class: klass = '' }: { activities: ActivityOut[]; class?: string } = $props();
</script>

{#if activities.length}
	<ul class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 {klass}">
		{#each activities as a (a.code)}
			<li>
				<a
					href={`/veiklos/${a.code}`}
					class="group relative flex h-full {a.image_url ? 'min-h-32' : 'min-h-20'} flex-col justify-end overflow-hidden rounded-xl border border-card-line bg-card p-4 transition hover:border-primary-checked focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-checked"
				>
					{#if a.image_url}
						<img
							src={a.image_url}
							alt={a.image_alt || a.name}
							loading="lazy"
							class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105"
						/>
						<span class="absolute inset-0 bg-linear-to-t from-black/70 to-black/0"></span>
					{/if}
					<span class="relative font-medium {a.image_url ? 'text-white' : 'text-foreground'}">{a.name}</span>
					<span class="relative mt-0.5 text-xs {a.image_url ? 'text-white/80' : 'text-muted-foreground-1'}">
						{a.product_count} prekės
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
