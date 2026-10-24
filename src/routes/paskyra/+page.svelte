<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import {
		ChevronRight,
		Gift,
		LogOut,
		Mail,
		MapPin,
		Package,
		Truck,
		Undo2,
		User
	} from '@lucide/svelte';

	let { data } = $props();
	const me = $derived(data.me);
	const orders = $derived(data.orders ?? []);
	const returns = $derived(data.returns ?? []);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	async function logout() {
		await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(
			() => {}
		);
		await invalidateAll();
		await goto('/');
	}

	const statusColor: Record<string, string> = {
		paid: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
		completed: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		pending_payment:
			'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
		cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
	};

	const cards = $derived([
		{
			href: '/paskyra/informacija',
			icon: User,
			title: 'Asmeninė informacija',
			desc: 'Vardas, telefonas, sutikimai'
		},
		{
			href: '/paskyra/uzsakymai',
			icon: Package,
			title: 'Užsakymai',
			desc: `${orders.length} užsakymų`
		},
		{
			href: '/paskyra/adresai',
			icon: MapPin,
			title: 'Adresai',
			desc: `${me.addresses?.length ?? 0} išsaugoti`
		},
		{
			href: '/paskyra/dovanu-korteles',
			icon: Gift,
			title: 'Dovanų kortelės',
			desc: 'Likutis ir panaudojimas'
		},
		{
			href: '/paskyra/grazinimai',
			icon: Undo2,
			title: 'Grąžinimai',
			desc: returns.length ? `${returns.length} grąžinimų` : 'RMA prašymai'
		},
		{
			href: '/paskyra/naujienlaiskis',
			icon: Mail,
			title: 'Naujienlaiškis',
			desc: 'Prenumeratos nustatymai'
		}
	]);
</script>

<svelte:head>
	<title>Paskyra — Baltijos Žvynas</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-foreground">
			Sveiki{me.first_name ? `, ${me.first_name}` : ''}!
		</h1>
		<p class="mt-1 text-sm text-muted-foreground-1">{me.email}</p>
	</div>
	<button
		type="button"
		onclick={logout}
		class="inline-flex items-center gap-x-1.5 rounded-lg border border-layer-line px-4 py-2 text-sm font-medium text-muted-foreground-1 hover:bg-layer-hover hover:text-foreground"
	>
		<LogOut class="size-4" /> Atsijungti
	</button>
</div>

<!-- Greitieji veiksmai -->
<div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
	{#each cards as c (c.href)}
		<a
			href={c.href}
			class="group flex items-start gap-x-3 rounded-xl border border-card-line bg-card p-4 transition-colors hover:border-primary/40 hover:bg-layer-hover"
		>
			<c.icon class="mt-0.5 size-5 shrink-0 text-primary" />
			<span class="min-w-0">
				<span class="block text-sm font-semibold text-foreground">{c.title}</span>
				<span class="mt-0.5 block truncate text-xs text-muted-foreground-1">{c.desc}</span>
			</span>
		</a>
	{/each}
</div>

<!-- Paštomatas -->
{#if me.primary_pickup_point}
	<div class="mt-6 flex items-center gap-x-3 rounded-xl border border-card-line bg-card p-4">
		<span class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
			<Truck class="size-4 text-primary" />
		</span>
		<div class="min-w-0">
			<p class="text-sm font-medium text-foreground">
				{me.primary_pickup_point.pickup_point_name}
				<span
					class="ml-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
					>Paštomatas</span
				>
			</p>
			<p class="text-xs text-muted-foreground-1">Numatytasis atsiėmimo punktas</p>
		</div>
		<a href="/paskyra/adresai" class="ml-auto text-sm font-medium text-primary hover:underline"
			>Keisti</a
		>
	</div>
{/if}

<!-- Paskutiniai užsakymai -->
<section class="mt-8">
	<div class="flex items-center justify-between">
		<h2 class="flex items-center gap-x-2 text-lg font-semibold text-foreground">
			<Package class="size-5" /> Paskutiniai užsakymai
		</h2>
		{#if orders.length > 5}
			<a
				href="/paskyra/uzsakymai"
				class="inline-flex items-center gap-x-1 text-sm font-medium text-primary hover:underline"
				>Visi <ChevronRight class="size-4" /></a
			>
		{/if}
	</div>
	{#if orders.length}
		<div class="mt-4 overflow-x-auto rounded-xl border border-card-line">
			<table class="min-w-full divide-y divide-card-line">
				<thead class="bg-card-header">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
							>Užsakymas</th
						>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
							>Data</th
						>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
							>Būsena</th
						>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
							>Mokėjimas</th
						>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
							>Suma</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-card-line bg-card">
					{#each orders.slice(0, 5) as o (o.id)}
						<tr
							class="cursor-pointer transition-colors hover:bg-layer-hover"
							onclick={() => goto(`/paskyra/uzsakymai/${o.id}`)}
						>
							<td class="px-4 py-3 text-sm font-medium text-foreground">#{o.id}</td>
							<td class="px-4 py-3 text-sm text-muted-foreground-1">{fmtDate(o.created_at)}</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColor[
										o.status
									] ?? 'bg-gray-100 text-gray-600'}"
								>
									{o.status_label || o.status}
								</span>
							</td>
							<td class="px-4 py-3 text-sm text-muted-foreground-1">
								{o.payment_provider_label || o.payment_provider || '—'}
								{#if o.payment_status_label}
									<span class="text-muted-foreground">· {o.payment_status_label}</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-sm font-semibold text-foreground"
								>{formatMoney(o.order_total)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div
			class="mt-4 rounded-xl border border-dashed border-layer-line py-12 text-center"
		>
			<p class="text-sm text-muted-foreground-1">Užsakymų dar nėra.</p>
			<a href="/katalogas" class="mt-2 inline-block text-sm font-medium text-primary"
				>Pereiti į katalogą →</a
			>
		</div>
	{/if}
</section>
