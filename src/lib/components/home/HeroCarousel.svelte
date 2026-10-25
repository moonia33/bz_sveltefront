<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { HomeSlide } from '#lib/api/endpoints';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';

	let { slides = [] }: { slides?: HomeSlide[] } = $props();

	let i = $state(0);
	let paused = $state(false);

	const count = $derived(slides.length);

	// Infinite loop — wraps around both ends.
	function go(n: number) {
		if (!count) return;
		i = (((n % count) + count) % count + count) % count;
	}

	// Autoplay every 6s; paused on hover or when the tab is hidden.
	$effect(() => {
		if (count <= 1) return;
		const timer = setInterval(() => {
			if (!paused && !document.hidden) go(i + 1);
		}, 6000);
		return () => clearInterval(timer);
	});
</script>

{#if count}
	<div
		class="relative"
		role="region"
		aria-roledescription="karuselė"
		aria-label="Reklaminės skaidrės"
		onmouseenter={() => (paused = true)}
		onmouseleave={() => (paused = false)}
	>
		<div class="relative overflow-hidden w-full h-120 md:h-160 bg-surface rounded-xl">
			<div
				class="absolute top-0 bottom-0 inset-s-0 w-full flex flex-nowrap transition-transform duration-700"
				style:transform="translateX(-{i * 100}%)"
			>
				{#each slides as slide, idx (idx)}
					<div class="w-full shrink-0">
						<div class="h-120 md:h-160 relative">
							{#if slide.image?.src}
								<img
									class="absolute inset-0 size-full object-cover rounded-xl"
									src={slide.image.src}
									alt={slide.image.alt || slide.title || ''}
									fetchpriority={idx === 0 ? 'high' : 'auto'}
									loading={idx === 0 ? 'eager' : 'lazy'}
									decoding="async"
								/>
							{/if}
							<div class="absolute inset-0 bg-black/25 rounded-xl"></div>
							<div
								class="relative z-10 text-center size-full max-w-lg mx-auto px-12 flex flex-col justify-center items-center"
							>
								{#if slide.title}
									<h2
										class="font-semibold text-3xl sm:text-4xl lg:text-5xl text-white"
									>
										{slide.title}
									</h2>
								{/if}
								{#if slide.subtitle}
									<p class="mt-3 text-sm md:text-base text-white">{slide.subtitle}</p>
								{/if}
								{#if slide.cta?.url}
									<div class="mt-5 md:mt-10">
										<div class="flex flex-wrap justify-center gap-5 lg:gap-10">
											<a
												class="text-sm md:text-base text-white underline underline-offset-4 hover:text-white/80 focus:outline-hidden focus:text-white/80"
												href={slide.cta.url}
											>
												{slide.cta.label || 'Žiūrėti'}
											</a>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		{#if count > 1}
			<button
				type="button"
				onclick={() => go(i - 1)}
				aria-label="Ankstesnė skaidrė"
				class="absolute top-1/2 inset-s-1 sm:inset-s-4 -translate-y-1/2 inline-flex justify-center items-center size-10 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus"
			>
				<ChevronLeft class="shrink-0 size-5" />
			</button>
			<button
				type="button"
				onclick={() => go(i + 1)}
				aria-label="Kita skaidrė"
				class="absolute top-1/2 inset-e-1 sm:inset-e-4 -translate-y-1/2 inline-flex justify-center items-center size-10 rounded-full bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus"
			>
				<ChevronRight class="shrink-0 size-5" />
			</button>

			<!-- Nav -->
			<div class="p-2 absolute bottom-0 inset-x-0 text-center">
				<div
					class="py-1 px-2 inline-flex justify-center items-center gap-2 bg-layer rounded-full"
				>
					<span class="text-xs text-foreground" aria-live="polite">
						<span class="inline-block min-w-2 text-center">{i + 1}</span> /
						<span class="inline-block min-w-2 text-center">{count}</span>
					</span>
				</div>
			</div>
			<!-- End Nav -->
		{/if}
	</div>
{:else}
	<MissingFeature feature="Hero skaidrės (homebuilder)" />
{/if}
