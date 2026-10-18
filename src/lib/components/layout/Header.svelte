<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Menu, Moon, Search, ShoppingCart, Sun, User, X } from '@lucide/svelte';
	import type { CategoryOut } from '#lib/api/types';

	let {
		categories = [],
		cartCount = 0
	}: { categories?: CategoryOut[]; cartCount?: number } = $props();

	let mobileOpen = $state(false);
	let catsOpen = $state(false);
	let q = $state(page.url.searchParams.get('q') ?? '');

	const topCategories = $derived(categories.filter((c) => !c.parent_id));

	let debounce: ReturnType<typeof setTimeout> | undefined;
	function onSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			const url = new URL(page.url.href);
			if (value.trim()) {
				if (url.pathname !== '/katalogas') url.pathname = '/katalogas';
				url.searchParams.set('q', value.trim());
				url.searchParams.delete('page');
				goto(url, { reset: false, replace: true });
			} else if (url.searchParams.has('q')) {
				url.searchParams.delete('q');
				goto(url, { reset: false, replace: true });
			}
		}, 200);
	}

	function toggleTheme() {
		const dark = document.documentElement.classList.toggle('dark');
		document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
	}
</script>

<header
	class="sticky top-0 z-40 w-full border-b border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
>
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

			<div class="mx-auto hidden min-w-0 flex-1 sm:block sm:max-w-lg">
				<div class="relative">
					<Search
						class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
					/>
					<input
						type="search"
						placeholder="Ieškoti prekių…"
						value={q}
						oninput={onSearchInput}
						aria-label="Paieška"
						class="block w-full rounded-full border-gray-200 bg-gray-100 py-2 pe-4 ps-10 text-sm text-gray-800 focus:border-zvynas-500 focus:ring-zvynas-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
					/>
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
					href="/paskyra"
					class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
					aria-label="Paskyra"><User class="size-5" /></a
				>
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
			</ul>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-gray-200 px-4 py-3 lg:hidden dark:border-neutral-700">
			<div class="relative mb-3 sm:hidden">
				<Search
					class="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
				/>
				<input
					type="search"
					placeholder="Ieškoti prekių…"
					value={q}
					oninput={onSearchInput}
					aria-label="Paieška"
					class="block w-full rounded-full border-gray-200 bg-gray-100 py-2 pe-4 ps-10 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
				/>
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
			</nav>
		</div>
	{/if}
</header>
