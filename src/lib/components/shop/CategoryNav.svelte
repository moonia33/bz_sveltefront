<script lang="ts">
	import { ChevronDown, X } from '@lucide/svelte';
	import type { CategoryOut } from '#lib/api/types';
	import Overlay from '#lib/components/ui/Overlay.svelte';

	let {
		all = [],
		activeSlug = '',
		open = $bindable(false)
	}: {
		all?: CategoryOut[];
		activeSlug?: string;
		open?: boolean;
	} = $props();

	const byId = $derived(new Map(all.map((c) => [c.id, c])));
	// Roots: parent_id null OR a dangling parent (BE list may not include every ancestor).
	const roots = $derived(all.filter((c) => c.parent_id == null || !byId.has(c.parent_id)));
	const childrenOf = (id: number) => all.filter((c) => c.parent_id === id);

	// Initially open the whole ancestor chain of the active category
	// (and the category itself when it has children).
	const initialOpen = $derived.by(() => {
		const set = new Set<number>();
		const active = all.find((c) => c.slug === activeSlug);
		if (!active) return set;
		if (childrenOf(active.id).length) set.add(active.id);
		let cur = active;
		const seen = new Set<number>();
		while (cur.parent_id != null && !seen.has(cur.id)) {
			seen.add(cur.id);
			const p = byId.get(cur.parent_id);
			if (!p) break;
			set.add(p.id);
			cur = p;
		}
		return set;
	});

	let expanded = $state<Set<number>>(new Set());
	$effect(() => {
		expanded = new Set(initialOpen);
	});

	function toggle(id: number) {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
	}
</script>

{#snippet navList(list: CategoryOut[], nested: boolean)}
	<ul
		class={nested
			? 'ps-7 mt-1 mb-1 flex flex-col gap-y-1 relative before:absolute before:top-0 before:inset-s-4.75 before:h-full before:border-s before:border-sidebar-divider'
			: 'flex flex-col gap-y-1'}
	>
		{#each list as cat (cat.id)}
			{@const kids = childrenOf(cat.id)}
			{@const isOpen = expanded.has(cat.id)}
			{@const isActive = cat.slug === activeSlug}
			<li>
				{#if kids.length}
					<div class="flex items-center rounded-lg {isActive ? 'bg-sidebar-nav-active' : ''}">
						<a
							href="/k/{cat.slug}"
							aria-current={isActive ? 'page' : undefined}
							onclick={() => (open = false)}
							class="min-w-0 grow text-start flex gap-x-3 py-2 px-3 text-sm text-sidebar-nav-foreground rounded-lg hover:bg-sidebar-nav-hover focus:outline-hidden focus:bg-sidebar-nav-focus {isActive
								? 'underline underline-offset-4'
								: ''}"
						>
							<span class="truncate">{cat.name}</span>
						</a>
						<button
							type="button"
							aria-expanded={isOpen}
							aria-label="{isOpen ? 'Suskleisti' : 'Išskleisti'} {cat.name}"
							onclick={() => toggle(cat.id)}
							class="me-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-nav-foreground hover:bg-sidebar-nav-hover focus:outline-hidden focus:bg-sidebar-nav-focus"
						>
							<ChevronDown
								class="shrink-0 size-4 transition-transform {isOpen ? '-rotate-180' : ''}"
							/>
						</button>
					</div>
					{#if isOpen}
						{@render navList(kids, true)}
					{/if}
				{:else}
					<a
						href="/k/{cat.slug}"
						aria-current={isActive ? 'page' : undefined}
						onclick={() => (open = false)}
						class="flex gap-x-4 py-2 px-3 text-sm text-sidebar-nav-foreground rounded-lg hover:bg-sidebar-nav-hover focus:outline-hidden focus:bg-sidebar-nav-focus {isActive
							? 'bg-sidebar-nav-active underline underline-offset-4'
							: ''}"
					>
						{cat.name}
					</a>
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet content()}
	<div class="p-5 lg:pt-10 lg:px-0">
		{@render navList(roots, false)}
	</div>
{/snippet}

<!-- Desktop: statinis sidebar -->
<aside class="hidden lg:block" aria-label="Kategorijų medis">
	{@render content()}
</aside>

<!-- Mobile: overlay -->
<Overlay bind:open side="start" label="Kategorijos" panelClass="overflow-y-auto">
	<div
		class="py-3 px-5 flex justify-between items-center gap-x-3 border-b border-sidebar-divider"
	>
		<span class="font-medium text-foreground">Kategorijos</span>
		<button
			type="button"
			onclick={() => (open = false)}
			class="size-6 inline-flex justify-center items-center gap-x-2 rounded-full bg-surface border border-surface-line text-surface-foreground hover:bg-surface-hover focus:outline-hidden focus:bg-surface-focus"
			aria-label="Uždaryti kategorijas"
		>
			<X class="shrink-0 size-4" />
		</button>
	</div>
	<div class="h-full overflow-y-auto">
		{@render content()}
	</div>
</Overlay>
