<script lang="ts">
	import {
		Heart,
		House,
		LayoutGrid,
		ShoppingCart,
		User
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import type { MeOut } from '#lib/api/types';
	import { m } from '#lib/paraglide/messages';

	let {
		cartCount = 0,
		favoriteCount = 0,
		me = null,
		onCatalog,
		onCart
	}: {
		cartCount?: number;
		favoriteCount?: number;
		me?: MeOut | null;
		onCatalog?: () => void;
		onCart?: () => void;
	} = $props();

	const pathname = $derived(page.url.pathname);
	const tab =
		'flex min-h-14 flex-col items-center justify-center gap-y-0.5 text-[10px] font-medium text-foreground focus:outline-hidden';
	const activeCls = 'text-primary';

	function isActive(path: string) {
		return path === '/' ? pathname === '/' : pathname.startsWith(path);
	}
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-navbar-line bg-navbar pb-[env(safe-area-inset-bottom)] md:hidden"
	aria-label={m.ui_main_nav()}
>
	<a href="/" class="{tab} {isActive('/') ? activeCls : ''}">
		<House class="size-5" />
		{m.ui_home()}
	</a>

	<button type="button" onclick={onCatalog} class={tab}>
		<LayoutGrid class="size-5" />
		Katalogas
	</button>

	<button type="button" onclick={onCart} class="relative {tab}">
		<span class="relative">
			<ShoppingCart class="size-5" />
			{#if cartCount > 0}
				<span
					class="absolute -top-1.5 -end-2.5 inline-flex min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-semibold text-secondary-foreground"
				>
					{cartCount > 99 ? '99' : cartCount}
				</span>
			{/if}
		</span>
		{m.nav_cart()}
	</button>

	<a href="/megstamos" class="relative {tab} {isActive('/megstamos') ? activeCls : ''}">
		<span class="relative">
			<Heart class="size-5" />
			{#if favoriteCount > 0}
				<span
					class="absolute -top-1.5 -end-2.5 inline-flex min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[9px] font-semibold text-secondary-foreground"
				>
					{favoriteCount > 99 ? '99' : favoriteCount}
				</span>
			{/if}
		</span>
		{m.nav_favorites()}
	</a>

	<a
		href={me ? '/paskyra' : '/prisijungti'}
		class="{tab} {isActive('/paskyra') ? activeCls : ''}"
	>
		<User class="size-5" />
		{me ? m.nav_account() : m.nav_login()}
	</a>
</nav>
