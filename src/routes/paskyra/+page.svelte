<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import { LogOut, MapPin, Package, Phone, Truck } from '@lucide/svelte';

	let { data } = $props();
	const me = $derived(data.me);
	const orders = $derived(data.orders ?? []);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	async function logout() {
		await fetch('/api/v1/auth/logout', {
			method: 'POST',
			credentials: 'include'
		}).catch(() => {});
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
</script>

<svelte:head>
	<title>Paskyra — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
				Sveiki{me.first_name ? `, ${me.first_name}` : ''}!
			</h1>
			<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">{me.email}</p>
		</div>
		<button
			type="button"
			onclick={logout}
			class="inline-flex items-center gap-x-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
		>
			<LogOut class="size-4" /> Atsijungti
		</button>
	</div>

	<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Profilis -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
		>
			<h2 class="font-semibold text-gray-900 dark:text-white">Profilis</h2>
			<dl class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-gray-500 dark:text-neutral-400">Vardas</dt>
					<dd class="text-gray-900 dark:text-white">
						{[me.first_name, me.last_name].filter(Boolean).join(' ') || '—'}
					</dd>
				</div>
				{#if me.phones?.length}
					<div class="flex items-center justify-between">
						<dt class="flex items-center gap-x-1 text-gray-500 dark:text-neutral-400"
							><Phone class="size-3.5" /> Telefonas</dt
						>
						<dd class="text-gray-900 dark:text-white">{me.phones[0].e164}</dd>
					</div>
				{/if}
				{#if me.primary_pickup_point}
					<div class="flex items-center justify-between">
						<dt class="flex items-center gap-x-1 text-gray-500 dark:text-neutral-400"
							><Truck class="size-3.5" /> Paštomatas</dt
						>
						<dd class="text-right text-gray-900 dark:text-white">
							{me.primary_pickup_point.name}, {me.primary_pickup_point.city}
						</dd>
					</div>
				{/if}
			</dl>
		</div>

		<!-- Adresai -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
		>
			<h2 class="flex items-center gap-x-1.5 font-semibold text-gray-900 dark:text-white">
				<MapPin class="size-4" /> Adresai
			</h2>
			{#if me.addresses?.length}
				<ul class="mt-3 space-y-3 text-sm">
					{#each me.addresses as a (a.id)}
						<li class="rounded-lg border border-gray-100 p-3 dark:border-neutral-800">
							<p class="font-medium text-gray-900 dark:text-white">
								{a.full_name || a.label}
							</p>
							<p class="text-gray-500 dark:text-neutral-400">
								{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city} {a.postal_code}
							</p>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-gray-500 dark:text-neutral-400">
					Adresų dar nėra — jie bus išsaugoti atlikus pirmą užsakymą.
				</p>
			{/if}
		</div>

		<!-- Kortelė su statistika -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
		>
			<h2 class="font-semibold text-gray-900 dark:text-white">Mano pirkimai</h2>
			<p class="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
			<p class="text-sm text-gray-500 dark:text-neutral-400">užsakymų</p>
		</div>
	</div>

	<!-- Užsakymai -->
	<section class="mt-10">
		<h2 class="flex items-center gap-x-2 text-lg font-semibold text-gray-900 dark:text-white">
			<Package class="size-5" /> Užsakymai
		</h2>
		{#if orders.length}
			<div class="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-neutral-700">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
					<thead class="bg-gray-50 dark:bg-neutral-800/60">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
								>Užsakymas</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
								>Data</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
								>Būsena</th
							>
							<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500"
								>Mokėjimas</th
							>
							<th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500"
								>Suma</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
						{#each orders as o (o.id)}
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white"
									>#{o.id}</td
								>
								<td class="px-4 py-3 text-sm text-gray-600 dark:text-neutral-300"
									>{fmtDate(o.created_at)}</td
								>
								<td class="px-4 py-3">
									<span
										class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColor[
											o.status
										] ?? 'bg-gray-100 text-gray-600'}"
									>
										{o.status_label || o.status}
									</span>
								</td>
								<td class="px-4 py-3 text-sm text-gray-600 dark:text-neutral-300">
									{o.payment_provider_label || o.payment_provider || '—'}
									{#if o.payment_status_label}
										<span class="text-gray-400">· {o.payment_status_label}</span>
									{/if}
								</td>
								<td
									class="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white"
									>{formatMoney(o.order_total)}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div
				class="mt-4 rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-neutral-700"
			>
				<p class="text-sm text-gray-500 dark:text-neutral-400">Užsakymų dar nėra.</p>
				<a href="/katalogas" class="mt-2 inline-block text-sm font-medium text-zvynas-600"
					>Pereiti į katalogą →</a
				>
			</div>
		{/if}
	</section>
</div>
