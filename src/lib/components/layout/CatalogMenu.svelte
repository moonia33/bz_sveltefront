<script lang="ts">
	import { ChevronDown, ChevronRight, Folder, Menu, X } from '@lucide/svelte';
	import type { CategoryOut, MegaMenuFeatureOut } from '#lib/api/types';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';

	let {
		categories = [],
		megaFeatures = {}
	}: {
		categories?: CategoryOut[];
		megaFeatures?: Record<string, MegaMenuFeatureOut>;
	} = $props();

	const MAX_GRANDCHILDREN = 6;

	let open = $state(false);
	let box = $state<HTMLDivElement | null>(null);
	let activeTab = $state<number | null>(null);
	let expandedLists = $state<Set<number>>(new Set());

	const byId = $derived(new Map(categories.map((c) => [c.id, c])));
	// Roots: parent_id null OR a dangling parent (same logic as CategoryNav).
	const topCategories = $derived(
		categories.filter((c) => c.parent_id == null || !byId.has(c.parent_id))
	);
	const childrenOf = (id: number) => categories.filter((c) => c.parent_id === id);
	const activeCat = $derived(
		topCategories.find((c) => c.id === activeTab) ?? topCategories[0] ?? null
	);
	const activeFeature = $derived(
		activeCat
			? (megaFeatures[String(activeCat.id)] ?? megaFeatures['default'] ?? null)
			: (megaFeatures['default'] ?? null)
	);

	function toggleOpen() {
		open = !open;
		if (open && activeTab == null) activeTab = topCategories[0]?.id ?? null;
	}

	function onWindowClick(e: MouseEvent) {
		if (open && box && !box.contains(e.target as Node)) open = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function toggleList(id: number) {
		const next = new Set(expandedLists);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedLists = next;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<!-- `static` wrapper: the mega-panel anchors to the nearest positioned ancestor (the sticky header),
     so it spans the full width below the header like in the marketplace template. -->
<div class="static" bind:this={box}>
	<button
		type="button"
		onclick={toggleOpen}
		aria-expanded={open}
		aria-haspopup="true"
		class="relative py-1.75 sm:py-2.5 px-3 flex items-center gap-x-1.5 text-sm bg-primary border border-primary-line text-primary-foreground rounded-lg hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus"
	>
		{#if open}
			<X class="shrink-0 size-4" />
		{:else}
			<Menu class="shrink-0 size-4" />
		{/if}
		Katalogas
	</button>

	{#if open}
		<div
			class="absolute top-full inset-s-0 z-30 w-full bg-dropdown border-y border-dropdown-line shadow-xl"
		>
			<div class="max-w-340 w-full mx-auto py-2 md:py-4 px-4 sm:px-6 lg:px-8">
				<!-- Mobile: native select switches the active tab -->
				<div class="sm:hidden mb-4">
					<label for="catalog-nav-select" class="sr-only">Kategorija</label>
					<select
						id="catalog-nav-select"
						bind:value={activeTab}
						class="py-2 px-3 pe-9 block w-full bg-surface border border-surface-line rounded-lg text-sm text-foreground focus:outline-hidden focus:border-primary-focus focus:ring-primary-focus"
					>
						{#each topCategories as cat (cat.id)}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<div class="flex">
					<!-- Sidebar -->
					<div
						class="hidden sm:block sm:pe-4 w-96 shrink-0 h-[75dvh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-track]:bg-scrollbar-track"
					>
						<div
							class="flex flex-col gap-y-1"
							role="tablist"
							aria-orientation="vertical"
							aria-label="Kategorijos"
						>
							{#each topCategories as cat (cat.id)}
								{@const isActive = activeCat?.id === cat.id}
								<a
									href="/k/{cat.slug}"
									role="tab"
									aria-selected={isActive}
									onmouseenter={() => (activeTab = cat.id)}
									onfocus={() => (activeTab = cat.id)}
									onclick={() => (open = false)}
									class="py-2.5 px-2 w-full flex items-center gap-x-2 text-start font-medium text-sm bg-layer text-navbar-nav-foreground rounded-lg hover:bg-navbar-nav-hover focus:outline-hidden focus:bg-navbar-nav-focus {isActive
										? 'bg-navbar-nav-active'
										: ''}"
								>
									{#if cat.menu_icon_url}
										<img
											src={cat.menu_icon_url}
											alt=""
											loading="lazy"
											class="shrink-0 size-4 rounded"
										/>
									{:else}
										<Folder class="shrink-0 size-4" />
									{/if}
									{cat.name}
									<ChevronRight class="shrink-0 size-3.5 ms-auto text-muted-foreground-1" />
								</a>
							{/each}
						</div>
					</div>
					<!-- End Sidebar -->

					<!-- Content -->
					<div
						class="pe-4 sm:px-10 w-full h-[75dvh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb [&::-webkit-scrollbar-track]:bg-scrollbar-track"
					>
						{#if activeCat}
							{@const kids = childrenOf(activeCat.id)}
							<div role="tabpanel" aria-label={activeCat.name}>
								{#if kids.length}
									<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 md:gap-10">
										{#each kids as child (child.id)}
											{@const grands = childrenOf(child.id)}
											{@const expanded = expandedLists.has(child.id)}
											<div class="space-y-7 md:space-y-10">
												<div>
													<span
														class="mb-2 flex justify-center items-center size-12 bg-surface text-surface-foreground rounded-xl"
													>
														{#if child.menu_icon_url}
															<img
																src={child.menu_icon_url}
																alt=""
																loading="lazy"
																class="shrink-0 size-6"
															/>
														{:else}
															<Folder class="shrink-0 size-6" />
														{/if}
													</span>
													<a
														href="/k/{child.slug}"
														onclick={() => (open = false)}
														class="block mb-3 font-medium text-sm text-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
														>{child.name}</a
													>
													{#if grands.length}
														<div class="flex flex-col gap-y-1">
															{#each expanded ? grands : grands.slice(0, MAX_GRANDCHILDREN) as grand (grand.id)}
																<div>
																	<a
																		href="/k/{grand.slug}"
																		onclick={() => (open = false)}
																		class="text-[13px] text-muted-foreground-1 underline-offset-4 hover:text-navbar-nav-foreground focus:outline-hidden focus:text-navbar-nav-foreground"
																		>{grand.name}</a
																	>
																</div>
															{/each}
															{#if grands.length > MAX_GRANDCHILDREN}
																<button
																	type="button"
																	onclick={() => toggleList(child.id)}
																	class="flex items-center gap-x-1 font-medium text-[13px] text-primary text-start hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
																>
																	{expanded ? 'Rodyti mažiau' : 'Rodyti daugiau'}
																	<ChevronDown
																		class="shrink-0 size-4 transition-transform {expanded
																			? 'rotate-180'
																			: ''}"
																	/>
																</button>
															{/if}
														</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<!-- Top category without children: single List -->
									<div class="grid grid-cols-1">
										<div>
											<span
												class="mb-2 flex justify-center items-center size-12 bg-surface text-surface-foreground rounded-xl"
											>
												{#if activeCat.menu_icon_url}
													<img
														src={activeCat.menu_icon_url}
														alt=""
														loading="lazy"
														class="shrink-0 size-6"
													/>
												{:else}
													<Folder class="shrink-0 size-6" />
												{/if}
											</span>
											<a
												href="/k/{activeCat.slug}"
												onclick={() => (open = false)}
												class="block mb-3 font-medium text-sm text-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus"
												>{activeCat.name}</a
											>
											<div class="flex flex-col gap-y-1">
												<div>
													<a
														href="/katalogas?category_slug={activeCat.slug}"
														onclick={() => (open = false)}
														class="text-[13px] text-muted-foreground-1 underline-offset-4 hover:text-navbar-nav-foreground focus:outline-hidden focus:text-navbar-nav-foreground"
														>Visos „{activeCat.name}“ prekės</a
													>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
					<!-- End Content -->

					<!-- Featured promo kortelė (BE: cms MegaMenuFeature) -->
					{#if activeFeature && (activeFeature.image_url || activeFeature.title)}
						<div class="hidden lg:block w-72 shrink-0 ps-4">
							<a
								href={activeFeature.url || '#'}
								onclick={() => (open = false)}
								class="group block overflow-hidden rounded-xl border border-layer-line bg-layer hover:border-primary-focus focus:outline-hidden focus:ring-primary-focus"
							>
								{#if activeFeature.image_url}
									<img
										src={activeFeature.image_url}
										alt={activeFeature.title}
										loading="lazy"
										class="aspect-4/3 w-full object-cover group-hover:scale-105 transition-transform"
									/>
								{/if}
								{#if activeFeature.title || activeFeature.text || activeFeature.cta_label}
									<div class="p-3">
										{#if activeFeature.title}
											<div class="font-semibold text-sm text-foreground">
												{activeFeature.title}
											</div>
										{/if}
										{#if activeFeature.text}
											<div class="mt-1 text-xs text-muted-foreground-1 line-clamp-3">
												{activeFeature.text}
											</div>
										{/if}
										{#if activeFeature.cta_label}
											<span
												class="mt-2 inline-flex items-center text-xs font-semibold text-primary group-hover:text-primary-hover"
											>
												{activeFeature.cta_label}
												<ChevronRight class="shrink-0 size-3.5 ms-0.5" />
											</span>
										{/if}
									</div>
								{/if}
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
