<script lang="ts">
	import { goto } from '$app/navigation';
	import { Loader2, Search } from '@lucide/svelte';
	import Overlay from '#lib/components/ui/Overlay.svelte';
	import { formatMoney } from '#lib/money';
	import type { CategoryOut, SuggestItemOut } from '#lib/api/types';

	let {
		open = $bindable(false),
		categories = []
	}: {
		open?: boolean;
		categories?: CategoryOut[];
	} = $props();

	let q = $state('');
	let suggestions = $state<SuggestItemOut[]>([]);
	let loading = $state(false);
	let activeIdx = $state(-1);
	let inputEl = $state<HTMLInputElement | null>(null);
	let debounce: ReturnType<typeof setTimeout> | undefined;
	let seq = 0;

	const topCategories = $derived(categories.filter((c) => !c.parent_id).slice(0, 8));
	const term = $derived(q.trim());

	$effect(() => {
		if (!open) return;
		activeIdx = -1;
		queueMicrotask(() => inputEl?.focus());
	});

	async function fetchSuggestions(value: string) {
		const id = ++seq;
		loading = true;
		try {
			const res = await fetch(
				`/api/v1/catalog/suggest?q=${encodeURIComponent(value)}`,
				{ credentials: 'include', headers: { Accept: 'application/json' } }
			);
			if (!res.ok) throw new Error();
			const data = await res.json();
			if (id !== seq) return;
			suggestions = data ?? [];
			activeIdx = -1;
		} catch {
			if (id === seq) suggestions = [];
		} finally {
			if (id === seq) loading = false;
		}
	}

	function onInput() {
		activeIdx = -1;
		clearTimeout(debounce);
		if (term.length >= 2) debounce = setTimeout(() => fetchSuggestions(term), 180);
		else suggestions = [];
	}

	function submit() {
		if (activeIdx >= 0 && suggestions[activeIdx]) goto(`/p/${suggestions[activeIdx].slug}`);
		else if (term) goto(`/katalogas?q=${encodeURIComponent(term)}`);
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' && suggestions.length) {
			e.preventDefault();
			activeIdx = (activeIdx + 1) % suggestions.length;
		} else if (e.key === 'ArrowUp' && suggestions.length) {
			e.preventDefault();
			activeIdx = (activeIdx - 1 + suggestions.length) % suggestions.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			submit();
		}
	}
</script>

<Overlay bind:open side="center" label="Paieška">
	<form
		class="p-3 sm:p-4 border-b border-overlay-line"
		role="search"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		<div class="relative">
			<Search class="pointer-events-none absolute inset-y-0 inset-s-4 my-auto size-5 text-muted-foreground-1" />
			<input
				bind:this={inputEl}
				type="search"
				name="q"
				bind:value={q}
				oninput={onInput}
				onkeydown={onKeydown}
				placeholder="Ieškoti prekių, gamintojų, kodų…"
				autocomplete="off"
				aria-label="Paieškos frazė"
				class="block w-full rounded-full border border-layer-line bg-layer py-2.5 ps-11 pe-4 text-base text-foreground placeholder:text-muted-foreground-1 focus:border-primary-focus focus:ring-primary-focus focus:outline-hidden"
			/>
		</div>
	</form>

	<div class="max-h-[70dvh] overflow-y-auto p-2 sm:p-3">
		{#if term.length < 2}
			<p class="px-2.5 pb-2 text-xs font-medium text-muted-foreground-1 uppercase">
				Populiarios kategorijos
			</p>
			<div class="flex flex-wrap gap-1.5 px-1 pb-2">
				{#each topCategories as c (c.id)}
					<a
						href="/k/{c.slug}"
						onclick={() => (open = false)}
						class="inline-flex items-center rounded-full border border-layer-line bg-layer px-3 py-1.5 text-sm text-layer-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
						>{c.name}</a
					>
				{/each}
			</div>
		{:else if loading && !suggestions.length}
			<div class="flex items-center gap-x-2 px-2.5 py-3 text-sm text-muted-foreground-1">
				<Loader2 class="size-4 animate-spin" /> Ieškoma…
			</div>
		{:else if suggestions.length}
			<ul class="space-y-1">
				{#each suggestions as p, i (p.id)}
					<li>
						<a
							href="/p/{p.slug}"
							onclick={() => (open = false)}
							class="flex items-center gap-x-3 rounded-lg px-2.5 py-1.5 {i === activeIdx
								? 'bg-muted-hover'
								: 'hover:bg-muted-hover'} focus:bg-muted-focus focus:outline-hidden"
						>
							{#if p.image_url}
								<img
									src={p.image_url}
									alt=""
									width="40"
									height="40"
									loading="lazy"
									class="size-10 shrink-0 rounded-lg bg-surface object-cover"
								/>
							{:else}
								<span class="size-10 shrink-0 rounded-lg bg-surface"></span>
							{/if}
							<span class="min-w-0 grow">
								<span class="block truncate text-sm text-foreground [&>mark]:bg-primary-100 [&>mark]:text-primary-800 [&>mark]:rounded-sm [&>mark]:px-0.5">{@html p.name_html || p.name}</span>
								<span class="block truncate text-xs text-muted-foreground-1"
									>{p.brand_name} {p.sku}</span
								>
							</span>
							{#if p.price}
								<span class="shrink-0 text-sm font-medium text-foreground"
									>{formatMoney(p.price)}</span
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
			<a
				href="/katalogas?q={encodeURIComponent(term)}"
				onclick={() => (open = false)}
				class="mt-1 block w-full rounded-lg py-2.5 text-center text-sm font-medium text-primary hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
			>
				Rodyti visus rezultatus „{term}“
			</a>
		{:else}
			<p class="px-2.5 py-3 text-sm text-muted-foreground-1">Nieko nerasta.</p>
		{/if}
	</div>
</Overlay>
