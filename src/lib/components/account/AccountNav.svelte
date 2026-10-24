<script lang="ts">
	import { page } from '$app/state';
	import {
		LayoutGrid,
		User,
		Package,
		MapPin,
		Gift,
		Mail,
		Undo2,
		CircleHelp
	} from '@lucide/svelte';

	const items = [
		{ href: '/paskyra', label: 'Apžvalga', icon: LayoutGrid, exact: true },
		{ href: '/paskyra/informacija', label: 'Asmeninė informacija', icon: User },
		{ href: '/paskyra/uzsakymai', label: 'Užsakymai', icon: Package },
		{ href: '/paskyra/adresai', label: 'Adresai', icon: MapPin },
		{ href: '/paskyra/dovanu-korteles', label: 'Dovanų kortelės', icon: Gift },
		{ href: '/paskyra/naujienlaiskis', label: 'Naujienlaiškis', icon: Mail },
		{ href: '/paskyra/grazinimai', label: 'Grąžinimai', icon: Undo2 },
		{ href: '/pagalba', label: 'Pagalba', icon: CircleHelp }
	];

	const path = $derived(page.url.pathname.replace(/\/+$/, '') || '/');
</script>

<nav class="flex flex-col gap-y-1">
	{#each items as item (item.href)}
		{@const active = item.exact ? path === item.href : path.startsWith(item.href)}
		<a
			href={item.href}
			class="flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {active
				? 'bg-primary/10 text-primary'
				: 'text-muted-foreground-1 hover:bg-layer-hover hover:text-foreground'}"
			aria-current={active ? 'page' : undefined}
		>
			<item.icon class="size-4 shrink-0" />
			{item.label}
		</a>
	{/each}
</nav>
