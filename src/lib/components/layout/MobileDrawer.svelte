<script lang="ts">
	import { fly } from 'svelte/transition';
	import {
		ChevronLeft,
		ChevronRight,
		Folder,
		Gift,
		Heart,
		HelpCircle,
		House,
		Info,
		Layers,
		LayoutGrid,
		MapPin,
		Package,
		Percent,
		Phone,
		ShoppingCart,
		Star,
		Store,
		Tag,
		ThumbsUp,
		Truck,
		User,
		X
	} from '@lucide/svelte';
	import type { CategoryOut, NavItemOut } from '#lib/api/types';
	import { m } from '#lib/paraglide/messages';

	let {
		open = $bindable(false),
		categories = [],
		navItems = []
	}: {
		open?: boolean;
		categories?: CategoryOut[];
		navItems?: NavItemOut[];
	} = $props();

	// Vieningas mazgas: ir CMS meniu item'ai, ir kategorijos.
	type Node = {
		key: string;
		label: string;
		url: string;
		icon: string;
		iconUrl: string;
		badge: string;
		highlight: boolean;
		children: Node[];
	};
	type Level = { title: string; url: string; nodes: Node[] };

	const ICONS: Record<string, typeof Percent> = {
		percent: Percent,
		'thumbs-up': ThumbsUp,
		package: Package,
		'layout-grid': LayoutGrid,
		store: Store,
		info: Info,
		'map-pin': MapPin,
		layers: Layers,
		'help-circle': HelpCircle,
		gift: Gift,
		truck: Truck,
		phone: Phone,
		heart: Heart,
		user: User,
		'shopping-cart': ShoppingCart,
		tag: Tag,
		star: Star,
		house: House
	};

	const catById = $derived(new Map(categories.map((c) => [c.id, c])));

	function catNode(c: CategoryOut): Node {
		return {
			key: `c${c.id}`,
			label: c.name,
			url: `/k/${c.slug}`,
			icon: '',
			iconUrl: c.menu_icon_url || '',
			badge: '',
			highlight: false,
			children: categories
				.filter((k) => k.parent_id === c.id)
				.map(catNode)
		};
	}

	function navNode(i: NavItemOut): Node {
		return {
			key: `n${i.id}`,
			label: i.label,
			url: i.url,
			icon: i.icon,
			iconUrl: '',
			badge: i.badge,
			highlight: i.highlight,
			children: (i.children ?? [])
				.filter((c) => c.show_in !== 'desktop')
				.map(navNode)
		};
	}

	// Featured nuorodos (CMS meniu) — atskirta vizuali grupė root lygyje.
	const featuredNodes = $derived(
		navItems.filter((i) => i.show_in !== 'desktop').map(navNode)
	);

	// Kategorijos nemaišomos su nuorodomis — atsidaro per „Prekių
	// katalogas" mazgą kaip atskiras drill-down lygis.
	const catalogNode = $derived<Node>({
		key: 'catalog',
		label: m.cat_menu_title(),
		url: '',
		icon: 'layout-grid',
		iconUrl: '',
		badge: '',
		highlight: false,
		children: categories
			.filter((c) => c.parent_id == null || !catById.has(c.parent_id))
			.map(catNode)
	});

	const rootLevel = $derived<Level>({
		title: m.nav_menu(),
		url: '',
		nodes: [catalogNode]
	});

	// Lygių krūva — nuoseklus gilinimas (drill-down).
	let stack = $state<Level[]>([]);
	const current = $derived(stack[stack.length - 1] ?? rootLevel);

	$effect(() => {
		if (!open) stack = [];
	});
	$effect(() => {
		document.body.style.overflow = open ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	function push(node: Node) {
		if (!node.children.length) return;
		stack = [...stack, { title: node.label, url: node.url, nodes: node.children }];
	}
	function pop() {
		stack = stack.slice(0, -1);
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) open = false;
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#if open}
	<!-- Backdrop -->
	<button
		type="button"
		aria-label={m.ui_close_menu()}
		onclick={() => (open = false)}
		class="fixed inset-0 z-50 bg-black/50 md:hidden"
	></button>

	<!-- Drawer -->
	<div
		class="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col bg-dropdown text-dropdown-foreground shadow-2xl md:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Navigacija"
		transition:fly={{ x: -320, duration: 180 }}
	>
		<!-- Header: back + title + close -->
		<div class="flex h-14 shrink-0 items-center gap-x-1 border-b border-dropdown-line px-2">
			{#if stack.length}
				<button
					type="button"
					onclick={pop}
					class="flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
					aria-label="Atgal"
				>
					<ChevronLeft class="size-5" />
				</button>
			{/if}
			<span class="grow truncate px-2 font-semibold text-foreground">
				{current.title}
			</span>
			<button
				type="button"
				onclick={() => (open = false)}
				class="flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
				aria-label={m.ui_close()}
			>
				<X class="size-5" />
			</button>
		</div>

		<!-- Levels -->
		<div class="relative grow overflow-hidden">
			{#key stack.length}
				<div
					class="absolute inset-0 overflow-y-auto overscroll-contain"
					transition:fly={{ x: stack.length ? 48 : 0, duration: 150 }}
				>
					<nav class="p-2">
						{#if stack.length === 0 && featuredNodes.length}
							<p class="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground-1">
								Trumpiniai
							</p>
							<div class="mb-3 rounded-xl border border-surface-line bg-surface p-1">
								{#each featuredNodes as node (node.key)}
									{@const Icon = ICONS[node.icon]}
									{#if node.children.length}
										<button
											type="button"
											onclick={() => push(node)}
											class="flex min-h-12 w-full items-center gap-x-3 rounded-lg px-3 text-start text-[15px] font-medium text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus {node.highlight
												? 'text-secondary'
												: ''}"
										>
											{#if Icon}
												<Icon class="size-5 shrink-0" />
											{/if}
											<span class="grow truncate">{node.label}</span>
											{#if node.badge}
												<span class="inline-flex items-center rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">{node.badge}</span>
											{/if}
											<ChevronRight class="size-4 shrink-0 text-muted-foreground-1" />
										</button>
									{:else}
										<a
											href={node.url || '#'}
											onclick={() => (open = false)}
											class="flex min-h-12 items-center gap-x-3 rounded-lg px-3 text-[15px] font-medium text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus {node.highlight
												? 'text-secondary'
												: ''}"
										>
											{#if Icon}
												<Icon class="size-5 shrink-0" />
											{/if}
											<span class="grow truncate">{node.label}</span>
											{#if node.badge}
												<span class="inline-flex items-center rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">{node.badge}</span>
											{/if}
										</a>
									{/if}
								{/each}
							</div>
							<p class="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground-1">
								Katalogas
							</p>
						{/if}
						{#if current.url}
							<a
								href={current.url}
								onclick={() => (open = false)}
								class="mb-1 flex min-h-12 items-center gap-x-3 rounded-lg bg-primary px-3 font-semibold text-primary-foreground focus:outline-hidden"
							>
								{m.all_of_title({ title: current.title })}
							</a>
						{/if}
						{#each current.nodes as node (node.key)}
							{@const Icon = ICONS[node.icon]}
							<div class="flex items-stretch">
								{#if node.children.length}
									<button
										type="button"
										onclick={() => push(node)}
										class="flex min-h-12 w-full items-center gap-x-3 rounded-lg px-3 text-start text-[15px] text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus {node.highlight
											? 'font-semibold text-secondary'
											: ''}"
									>
										{#if node.iconUrl}
											<img src={node.iconUrl} alt="" loading="lazy" class="size-6 shrink-0 rounded" />
										{:else if Icon}
											<Icon class="size-5 shrink-0" />
										{:else}
											<Folder class="size-5 shrink-0 text-muted-foreground-1" />
										{/if}
										<span class="grow truncate">{node.label}</span>
										{#if node.badge}
											<span class="inline-flex items-center rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">{node.badge}</span>
										{/if}
										<ChevronRight class="size-4 shrink-0 text-muted-foreground-1" />
									</button>
								{:else}
									<a
										href={node.url || '#'}
										onclick={() => (open = false)}
										class="flex min-h-12 w-full items-center gap-x-3 rounded-lg px-3 text-[15px] text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus {node.highlight
											? 'font-semibold text-secondary'
											: ''}"
									>
										{#if node.iconUrl}
											<img src={node.iconUrl} alt="" loading="lazy" class="size-6 shrink-0 rounded" />
										{:else if Icon}
											<Icon class="size-5 shrink-0" />
										{:else}
											<Folder class="size-5 shrink-0 text-muted-foreground-1" />
										{/if}
										<span class="grow truncate">{node.label}</span>
										{#if node.badge}
											<span class="inline-flex items-center rounded-full bg-secondary px-1.5 py-px text-[10px] font-semibold text-secondary-foreground">{node.badge}</span>
										{/if}
									</a>
								{/if}
							</div>
						{/each}
					</nav>
				</div>
			{/key}
		</div>
	</div>
{/if}
