<script lang="ts">
	import type { ActivityOut } from '#lib/api/types';
	import { lh } from '#lib/i18n/instance';

	let { activities, class: klass = '' }: { activities: ActivityOut[]; class?: string } = $props();
</script>

{#if activities.length}
	<ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 {klass}">
		{#each activities as a (a.code)}
			<li>
				<a href={lh(`/veiklos/${a.code}`)} class="group relative block focus:outline-hidden">
					<div class="overflow-hidden rounded-xl bg-surface">
						{#if a.image_url}
							<img
								src={a.image_url}
								alt={a.image_alt || a.name}
								loading="lazy"
								decoding="async"
								class="h-40 w-full rounded-xl object-cover transition-transform duration-500 ease-in-out group-hover:scale-105 group-focus:scale-105"
							/>
						{:else}
							<div class="h-40 w-full"></div>
						{/if}
					</div>
					<div class="absolute inset-0">
						<div class="flex h-full flex-col items-center justify-center">
							<span
								class="rounded-full bg-layer px-3 py-1 text-xs uppercase text-layer-foreground transition group-focus-visible:ring-2 group-focus-visible:ring-primary-checked"
							>
								{a.name}
							</span>
						</div>
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}
