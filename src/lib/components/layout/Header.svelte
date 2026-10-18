<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Menu, Moon, Search, ShoppingCart, Sun, User, X, Loader2 } from '@lucide/svelte';
	import { formatMoney } from '#lib/money';
	import type { CategoryOut, ProductListOut } from '#lib/api/types';

	let {
		categories = [],
		cartCount = 0,
		me = null
	}: {
		categories?: CategoryOut[];
		cartCount?: number;
		me?: { email: string; first_name: string } | null;
	} = $props();

	let mobileOpen = $state(false);
	let catsOpen = $state(false);
	let q = $state(page.url.searchParams.get('q') ?? '');

	// --- Typeahead ---
	let suggestions = $state<ProductListOut[]>([]);
	let suggestOpen = $state(false);
	let suggestLoading = $state(false);
	let activeIdx = $state(-1);
	let searchBox: HTMLDivElement | null = $state(null);

	let debounce: ReturnType<typeof setTimeout> | undefined;
	async function fetchSuggestions(value: string) {
		const term = value.trim();
		if (term.length < 2) {
			suggestions = [];
			suggestOpen = false;
			return;
		}
		suggestLoading = true;
		suggestOpen = true;
		try {
			const res = await fetch(
				`/api/v1/catalog/products?q=${encodeURIComponent(term)}&page_size=6`,
				{ credentials: 'include', headers: { Accept: 'application/json' } }
			);
			if (!res.ok) throw new Error();
			const data = await res.json();
			suggestions = data.items ?? [];
			activeIdx = -1;
		} catch {
			suggestions = [];
		} finally {
			suggestLoading = false;
		}
	}

	function onSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		q = value;
		clearTimeout(debounce);
		debounce = setTimeout(() => fetchSuggestions(value), 180);
	}

	function submitSearch() {
		const term = q.trim();
		suggestOpen = false;
		if (!term) return;
		goto(`/katalogas?q=${encodeURIComponent(term)}`);
	}

	function onSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			suggestOpen = false;
			return;
		}
		if (!suggestOpen || !suggestions.length) {
			if (e.key === 'Enter') submitSearch();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			activeIdx = (activeIdx + 1) % suggestions.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			activeIdx = (activeIdx - 1 + suggestions.length) % suggestions.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (activeIdx >= 0 && suggestions[activeIdx]) {
				suggestOpen = false;
				goto(`/p/${suggestions[activeIdx].slug}`);
			} else {
				submitSearch();
			}
		}
	}

	function onWindowClick(e: MouseEvent) {
		if (searchBox && !searchBox.contains(e.target as Node)) suggestOpen = false;
	}

	function toggleTheme() {
		const dark = document.documentElement.classList.toggle('dark');
		document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
	}

	const topCategories = $derived(categories.filter((c) => !c.parent_id));
</script>

<svelte:window onclick={onWindowClick} />

<header
	class="sticky top-0 z-40 w-full border-b border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
>
	<!-- Viršutinė juosta -->
	<div class="bg-zvynas-600 text-white">
		<div
			class="mx-auto flex max-w-7xl items-center justify-center px-4 py-1.5 text-center text-xs font-medium sm:px-6 lg:px-8"
		>
			Nemokamas pristatymas užsakymams nuo 50 €
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center gap-x-4">
			<button
				type="button"
				class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
				aria-label="Meniu"
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				{#if mobileOpen}<X class="size-5" />{:else}<Menu class="size-5" />{/if}
			</button>

			<a href="/" class="flex shrink-0 items-center gap-x-2" aria-label="Baltijos Žvynas">
				<span
					class="flex size-9 items-center justify-center rounded-lg bg-zvynas-600 text-lg font-bold text-white"
					>BŽ</span
				>
				<span class="hidden text-lg font-semibold text-gray-900 sm:block dark:text-white"
					>Baltijos Žvynas</span
				>
			</a>

			<!-- Paieška su pasiūlymais -->
			<div class="mx-auto hidden min-w-0 flex-1 sm:block sm:max-w-lg" bind:this={searchBox}>
				<div class="relative">
					<Search
						class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="search"
						placeholder="Ieškoti prekių, gamintojų, kodų…"
						value={q}
						oninput={onSearchInput}
						onkeydown={onSearchKeydown}
						onfocus={() => {
							if (suggestions.length) suggestOpen = true;
						}}
						role="combobox"
						aria-expanded={suggestOpen}
						aria-controls="search-suggestions"
						aria-activedescendant={activeIdx >= 0 ? `sugg-${activeIdx}` : undefined}
						aria-label="Paieška"
						class="block w-full rounded-full border-gray-200 bg-gray-100 py-2 pe-4 ps-10 text-sm text-gray-800 focus:border-zvynas-500 focus:bg-white focus:ring-zvynas-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:bg-neutral-900"
					/>

					{#if suggestOpen}
						<div
							id="search-suggestions"
							role="listbox"
							class="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900"
						>
							{#if suggestLoading}
								<div class="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
									<Loader2 class="size-4 animate-spin" /> Ieškoma…
								</div>
							{:else if suggestions.length}
								<ul>
									{#each suggestions as p, i (p.id)}
										<li role="option" id="sugg-{i}" aria-selected={i === activeIdx}>
											<a
												href="/p/{p.slug}"
												onclick={() => (suggestOpen = false)}
												class="flex items-center gap-3 px-3 py-2 {i === activeIdx
													? 'bg-gray-100 dark:bg-neutral-800'
													: 'hover:bg-gray-50 dark:hover:bg-neutral-800/60'}"
											>
												{#if p.images?.[0]}
													<img
														src={p.images[0].url}
														alt=""
														width="40"
														height="40"
														class="size-10 shrink-0 rounded-lg object-cover"
														loading="lazy"
													/>
												{/if}
												<span class="min-w-0 grow">
													<span
														class="block truncate text-sm font-medium text-gray-900 dark:text-white"
														>{p.name}</span
													>
													<span class="block truncate text-xs text-gray-400"
														>{p.brand?.name ?? ''} {p.sku}</span
													>
												</span>
												<span
													class="shrink-0 text-sm font-semibold text-gray-900 dark:text-white"
													>{formatMoney(p.price)}</span
												>
											</a>
										</li>
									{/each}
								</ul>
								<button
									type="button"
									onclick={submitSearch}
									class="block w-full border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-zvynas-600 hover:bg-gray-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
								>
									Rodyti visus rezultatus „{q.trim()}“
								</button>
							{:else if q.trim().length >= 2}
								<div class="px-4 py-3 text-sm text-gray-500">Nieko nerasta.</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<nav class="ms-auto flex items-center gap-x-1">
				<button
					type="button"
					onclick={toggleTheme}
					class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Perjungti temą"
				>
					<Sun class="size-5 dark:hidden" /><Moon class="hidden size-5 dark:block" />
				</button>
				<a
					href={me ? '/paskyra' : '/prisijungti'}
					class="flex items-center gap-x-1.5 rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Paskyra"
				>
					<User class="size-5" />
					{#if me?.first_name}
						<span class="hidden text-sm font-medium md:block">{me.first_name}</span>
					{/if}
				</a>
				<a
					href="/krepselis"
					class="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Krepšelis"
				>
					<ShoppingCart class="size-5" />
					{#if cartCount > 0}
						<span
							class="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-zvynas-600 text-[10px] font-semibold text-white"
							>{cartCount > 99 ? '99' : cartCount}</span
						>
					{/if}
				</a>
			</nav>
		</div>

		<!-- Kategorijų juosta -->
		<div class="relative hidden pb-0 lg:block">
			<ul class="flex items-center gap-x-1 overflow-x-auto pb-2">
				<li class="relative">
					<button
						type="button"
						class="flex items-center gap-x-1 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
						aria-expanded={catsOpen}
						aria-haspopup="true"
						onclick={() => (catsOpen = !catsOpen)}
					>
						<Menu class="size-4" /> Visos kategorijos
					</button>
					{#if catsOpen}
						<div
							class="absolute start-0 top-full z-50 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
						>
							{#each categories as c (c.id)}
								<a
									href="/k/{c.slug}"
									onclick={() => (catsOpen = false)}
									class="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
									class:ps-6={!!c.parent_id}
								>
									{c.name}
								</a>
							{/each}
						</div>
					{/if}
				</li>
				{#each topCategories.slice(0, 6) as c (c.id)}
					<li>
						<a
							href="/k/{c.slug}"
							class="block rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
							>{c.name}</a
						>
					</li>
				{/each}
				<li class="ms-auto">
					<a
						href="/katalogas"
						class="block rounded-lg px-3 py-1.5 text-sm font-medium text-zvynas-600 hover:bg-zvynas-50 dark:hover:bg-zvynas-500/10"
						>Visos prekės →</a
					>
				</li>
			</ul>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-gray-200 px-4 py-3 lg:hidden dark:border-neutral-700">
			<div class="relative mb-3 sm:hidden">
				<Search
					class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
				/>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						mobileOpen = false;
						submitSearch();
					}}
				>
					<input
						type="search"
						placeholder="Ieškoti prekių…"
						bind:value={q}
						aria-label="Paieška"
						class="block w-full rounded-full border-gray-200 bg-gray-100 py-2 pe-4 ps-10 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
					/>
				</form>
			</div>
			<nav class="flex flex-col">
				{#each categories as c (c.id)}
					<a
						href="/k/{c.slug}"
						onclick={() => (mobileOpen = false)}
						class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
						class:ps-6={!!c.parent_id}>{c.name}</a
					>
				{/each}
				<a
					href="/katalogas"
					onclick={() => (mobileOpen = false)}
					class="rounded-lg px-3 py-2 text-sm font-medium text-zvynas-600">Visos prekės →</a
				>
			</nav>
		</div>
	{/if}
</header>
