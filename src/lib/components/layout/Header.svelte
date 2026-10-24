<script lang="ts">
	import {
		ChevronDown,
		Gift,
		Heart,
		HelpCircle,
		House,
		Info,
		Layers,
		LayoutGrid,
		MapPin,
		Moon,
		Package,
		Percent,
		Phone,
		Search,
		ShoppingCart,
		Star,
		Store,
		Sun,
		Tag,
		ThumbsUp,
		Truck,
		User
	} from '@lucide/svelte';
	import type {
		CartOut,
		CategoryOut,
		MeOut,
		NavItemOut,
		NavigationOut
	} from '#lib/api/types';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import CatalogMenu from './CatalogMenu.svelte';
	import MiniCart from './MiniCart.svelte';
	import SearchModal from './SearchModal.svelte';

	let {
		categories = [],
		cart = null,
		me = null,
		favoriteCount = 0,
		navigation = null
	}: {
		categories?: CategoryOut[];
		cart?: CartOut | null;
		me?: MeOut | null;
		favoriteCount?: number;
		navigation?: NavigationOut | null;
	} = $props();

	let cartOpen = $state(false);
	let accountOpen = $state(false);
	let accountBox = $state<HTMLDivElement | null>(null);
	let navBox = $state<HTMLDivElement | null>(null);
	let openNavId = $state<number | null>(null);
	let searchOpen = $state(false);

	const cartCount = $derived(cart?.items?.reduce((sum, i) => sum + i.qty, 0) ?? 0);

	// Fallback'as, jei /cms/navigation nepasiekiamas — identiškas ankstesniam
	// hardkodintam meniu, kad storefront niekada neliktų be navigacijos.
	const FALLBACK_ITEMS: NavItemOut[] = [
		{
			id: -1, kind: 'preset', label: 'Nuolaidos',
			url: '/katalogas?sort=discounted', icon: 'percent', badge: '',
			highlight: false, new_tab: false, show_in: 'all', children: []
		},
		{
			id: -2, kind: 'preset', label: 'Populiariausios',
			url: '/katalogas?sort=best_selling', icon: 'thumbs-up', badge: '',
			highlight: false, new_tab: false, show_in: 'all', children: []
		},
		{
			id: -3, kind: 'preset', label: 'Naujienos',
			url: '/katalogas?sort=-created', icon: 'package', badge: '',
			highlight: false, new_tab: false, show_in: 'all', children: []
		},
		{
			id: -4, kind: 'preset', label: 'Visos kategorijos',
			url: '/kategorijos', icon: 'layout-grid', badge: '',
			highlight: false, new_tab: false, show_in: 'all', children: []
		},
		{
			id: -5, kind: 'preset', label: 'Visos prekės',
			url: '/katalogas', icon: 'store', badge: '',
			highlight: false, new_tab: false, show_in: 'all', children: []
		},
		{
			id: -6, kind: 'link', label: 'Puslapiai', url: '', icon: 'layers',
			badge: '', highlight: false, new_tab: false, show_in: 'all',
			children: [
				{ id: -61, kind: 'link', label: 'Pristatymas', url: '/info/pristatymas', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -62, kind: 'link', label: 'Grąžinimas', url: '/info/grazinimas', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -63, kind: 'link', label: 'DUK', url: '/info/duk', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -64, kind: 'link', label: 'Kontaktai', url: '/info/kontaktai', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] }
			]
		}
	];

	const navItems = $derived(
		navigation?.items?.length ? navigation.items : FALLBACK_ITEMS
	);
	const promoText = $derived(
		navigation?.promo?.label || 'Nemokamas pristatymas užsakymams nuo 50 €'
	);
	const promoUrl = $derived(navigation?.promo?.url || '');

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

	const navPill =
		'py-2 px-3 flex items-center gap-x-1.5 text-sm whitespace-nowrap text-navbar-nav-foreground rounded-full hover:bg-navbar-nav-hover focus:outline-hidden focus:bg-navbar-nav-focus';
	const widgetBtn =
		'flex flex-col justify-center items-center gap-1 min-w-10 sm:min-w-14 min-h-8 text-xs rounded-full text-foreground hover:text-primary-hover focus:outline-hidden focus:text-primary-focus';

	function toggleTheme() {
		const dark = document.documentElement.classList.toggle('dark');
		document.cookie = `theme=${dark ? 'dark' : 'light'}; path=/; max-age=31536000; samesite=lax`;
	}

	function onWindowClick(e: MouseEvent) {
		if (accountBox && !accountBox.contains(e.target as Node)) accountOpen = false;
		if (navBox && !navBox.contains(e.target as Node)) openNavId = null;
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class="bg-primary text-primary-foreground">
	<div
		class="mx-auto flex max-w-340 items-center justify-center gap-x-2 px-4 py-1.5 text-center text-xs sm:px-6 lg:px-8"
	>
		{#if promoUrl}
			<a href={promoUrl} class="hover:underline">{promoText}</a>
		{:else}
			{promoText}
		{/if}
		{#if !navigation}<MissingFeature compact feature="Meniu/promo juosta iš CMS (/cms/navigation)" />{/if}
	</div>
</div>

<header class="sticky top-0 z-50 flex flex-col bg-navbar border-b border-navbar-line">
	<!-- Main row -->
	<div class="max-w-340 basis-full w-full mx-auto py-3 px-4 sm:px-6 lg:px-8">
		<div class="w-full flex md:flex-nowrap md:items-center gap-2 lg:gap-6">
			<!-- Logo -->
			<div class="order-1 md:w-auto flex items-center gap-x-1">
				<a
					href="/"
					class="flex items-center rounded-md font-semibold focus:outline-hidden focus:opacity-80"
					aria-label="Baltijos Žvynas"
				>
					<img
						src="https://baltijoszvynas.lt/img/logo-1715070576.jpg"
						alt="Baltijos Žvynas"
						width="72"
						height="72"
						class="h-18 w-auto rounded-sm bg-white object-contain"
					/>
				</a>
			</div>
			<!-- End Logo -->

			<!-- Catalog + Search -->
			<div class="md:w-full order-2 md:grow md:w-auto">
				<div class="flex basis-full items-center gap-x-1 md:gap-x-3">
					<CatalogMenu {categories} megaFeatures={navigation?.mega_features ?? {}} />

					<div class="hidden md:block w-full">
						<button
							type="button"
							onclick={() => (searchOpen = true)}
							aria-label="Paieška"
							class="relative flex w-full items-center py-1.5 sm:py-2.5 ps-4 pe-10 bg-layer border border-layer-line rounded-full text-base sm:text-sm text-start text-muted-foreground-1 hover:bg-muted-hover focus:outline-hidden focus:border-primary-focus focus:ring-primary-focus"
						>
							Ieškoti prekių, gamintojų, kodų…
							<span class="absolute inset-y-0 inset-e-0 z-10 flex items-center pe-1 sm:pe-1.5">
								<span
									class="inline-flex shrink-0 justify-center items-center w-10 h-8 rounded-full bg-primary border border-primary-line text-primary-foreground"
								>
									<Search class="shrink-0 size-4" />
								</span>
							</span>
						</button>
					</div>
				</div>
			</div>
			<!-- End Catalog + Search -->

			<!-- Widgets -->
			<div class="order-2 md:order-3 ms-auto lg:ms-0">
				<div class="flex justify-end items-center gap-x-2">
					<button
						type="button"
						onclick={() => (searchOpen = true)}
						aria-label="Paieška"
						class="{widgetBtn} md:hidden"
					>
						<Search class="shrink-0 size-4" />
						<span class="hidden sm:inline">Paieška</span>
					</button>
					{#if me}
						<div class="relative" bind:this={accountBox}>
							<button
								type="button"
								onclick={() => (accountOpen = !accountOpen)}
								aria-expanded={accountOpen}
								aria-haspopup="true"
								class={widgetBtn}
							>
								<User class="shrink-0 size-4" />
								<span class="hidden max-w-20 truncate sm:inline">{me.first_name || 'Paskyra'}</span>
							</button>
							{#if accountOpen}
								<div
									class="absolute top-full inset-e-0 z-30 mt-2 w-72 rounded-xl border border-dropdown-line bg-dropdown shadow-xl"
								>
									<div class="p-2">
										<a
											class="py-2 px-2.5 flex items-center gap-3 rounded-lg hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
											href="/paskyra"
											onclick={() => (accountOpen = false)}
										>
											<span
												class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
												><User class="size-5" /></span
											>
											<span class="grow min-w-0">
												<span class="block font-medium text-sm text-foreground"
													>{me.first_name || 'Mano paskyra'}</span
												>
												<span class="block truncate text-xs text-muted-foreground-1"
													>{me.email}</span
												>
											</span>
										</a>
										<div class="my-2 mx-2.5 h-px bg-line-2"></div>
										<ul class="flex flex-col space-y-0.5">
											<li>
												<a
													class="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-foreground rounded-lg hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
													href="/paskyra"
													onclick={() => (accountOpen = false)}>Paskyra</a
												>
											</li>
											<li>
												<a
													class="w-full flex items-center gap-x-3.5 py-2 px-2.5 text-sm text-foreground rounded-lg hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
													href="/paskyra#uzsakymai"
													onclick={() => (accountOpen = false)}>Užsakymai</a
												>
											</li>
										</ul>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<a href="/prisijungti" class={widgetBtn}>
							<User class="shrink-0 size-4" />
							<span class="hidden sm:inline">Prisijungti</span>
						</a>
					{/if}

					<a href="/megstamos" class="relative {widgetBtn} hidden sm:flex">
						<Heart class="shrink-0 size-4" />
						<span class="hidden sm:inline">Mėgstamiausi</span>
						{#if favoriteCount > 0}
							<span class="flex absolute top-0 inset-e-0 z-10 -mt-1 -me-1">
								<span
									class="relative min-w-4.5 min-h-4.5 inline-flex justify-center items-center text-[10px] bg-secondary text-secondary-foreground rounded-full px-1"
								>
									{favoriteCount > 99 ? '99' : favoriteCount}
									<span class="sr-only">prekės mėgstamose</span>
								</span>
							</span>
						{/if}
					</a>

					<button
						type="button"
						onclick={() => (cartOpen = true)}
						class="relative {widgetBtn}"
					>
						<ShoppingCart class="shrink-0 size-4" />
						<span class="hidden sm:inline">Krepšelis</span>
						{#if cartCount > 0}
							<span class="flex absolute top-0 inset-e-0 z-10 -mt-1 -me-1">
								<span
									class="relative min-w-4.5 min-h-4.5 inline-flex justify-center items-center text-[10px] bg-secondary text-secondary-foreground rounded-full px-1"
								>
									{cartCount > 99 ? '99' : cartCount}
									<span class="sr-only">prekės krepšelyje</span>
								</span>
							</span>
						{/if}
					</button>
				</div>
			</div>
			<!-- End Widgets -->
		</div>

	</div>
	<!-- End Main row -->

	<!-- Bottom nav (BE meniu: cms Menu 'header') -->
	<div
		class="relative flex items-center max-w-340 w-full mx-auto px-4 sm:px-6 lg:px-8 pb-1"
		bind:this={navBox}
	>
		<div
			class="flex min-w-0 flex-1 items-center gap-x-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
		>
			{#each navItems as item (item.id)}
				{@const Icon = ICONS[item.icon]}
				{@const hasChildren = (item.children ?? []).length > 0}
				<div class="relative shrink-0">
					{#if hasChildren}
						<button
							type="button"
							onclick={() => (openNavId = openNavId === item.id ? null : item.id)}
							aria-expanded={openNavId === item.id}
							aria-haspopup="true"
							class="{navPill} w-full lg:w-auto text-start {item.highlight
								? 'font-semibold text-secondary'
								: ''}"
						>
							{#if Icon}<Icon class="shrink-0 size-3.5" />{/if}
							{item.label}
							{#if item.badge}
								<span
									class="inline-flex items-center text-[10px] font-semibold bg-secondary text-secondary-foreground rounded-full px-1.5 py-px"
									>{item.badge}</span
								>
							{/if}
							<ChevronDown
								class="shrink-0 size-4 transition-transform {openNavId === item.id
									? 'rotate-180'
									: ''}"
							/>
						</button>
					{:else}
						<a
							href={item.url || '#'}
							target={item.new_tab ? '_blank' : undefined}
							rel={item.new_tab ? 'noopener noreferrer' : undefined}
							class="{navPill} w-full lg:w-auto text-start {item.highlight
								? 'font-semibold text-secondary'
								: ''}"
						>
							{#if Icon}<Icon class="shrink-0 size-3.5" />{/if}
							{item.label}
							{#if item.badge}
								<span
									class="inline-flex items-center text-[10px] font-semibold bg-secondary text-secondary-foreground rounded-full px-1.5 py-px"
									>{item.badge}</span
								>
							{/if}
						</a>
					{/if}

					{#if hasChildren && openNavId === item.id}
						<div
							class="absolute top-full inset-s-0 z-30 mt-1 w-56 rounded-xl border border-dropdown-line bg-dropdown shadow-lg"
						>
							<div class="p-1 space-y-0.5">
								{#each item.children as child (child.id)}
									{@const ChildIcon = ICONS[child.icon]}
									<a
										class="py-2 px-3 flex items-center gap-x-3 text-sm text-navbar-nav-foreground hover:bg-navbar-nav-hover rounded-lg focus:outline-hidden focus:bg-navbar-nav-focus"
										href={child.url || '#'}
										target={child.new_tab ? '_blank' : undefined}
										rel={child.new_tab ? 'noopener noreferrer' : undefined}
										onclick={() => (openNavId = null)}
									>
										{#if ChildIcon}<ChildIcon class="shrink-0 size-3.5" />{/if}
										{child.label}
										{#if child.badge}
											<span
												class="inline-flex items-center text-[10px] font-semibold bg-secondary text-secondary-foreground rounded-full px-1.5 py-px"
												>{child.badge}</span
											>
										{/if}
									</a>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<button
			type="button"
			onclick={toggleTheme}
			aria-label="Perjungti temą"
			class="{navPill} shrink-0"
		>
			<Moon class="shrink-0 size-3.5 dark:hidden" />
			<Sun class="hidden shrink-0 size-3.5 dark:block" />
			<span class="sr-only">Perjungti temą</span>
		</button>
	</div>
	<!-- End Bottom nav -->
</header>

<SearchModal bind:open={searchOpen} {categories} />
<MiniCart bind:open={cartOpen} {cart} />
