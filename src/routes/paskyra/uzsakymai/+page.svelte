<script lang="ts">
	import { formatMoney } from '#lib/money';
	import { ChevronRight, Package } from '@lucide/svelte';

	let { data } = $props();
	const orders = $derived(data.orders ?? []);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	const statusColor: Record<string, string> = {
		paid: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
		completed: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		pending_payment: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
		cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
	};
</script>

<svelte:head>
	<title>Mano užsakymai — Baltijos Žvynas</title>
</svelte:head>

<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
	<Package class="size-6" /> Mano užsakymai
</h1>
<p class="mt-1 text-sm text-muted-foreground-1">
	{orders.length} užsakymų — spauskite eilutę, kad pamatytumėte detales ir sąskaitą.
</p>

{#if orders.length}
	<div class="mt-6 overflow-x-auto rounded-xl border border-card-line">
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
						>Pristatymas</th
					>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Mokėjimas</th
					>
					<th class="px-4 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Suma</th
					>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-card-line bg-card">
				{#each orders as o (o.id)}
					<tr>
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
							{o.delivery_status_label || o.delivery_status || '—'}
							{#if o.tracking_number}
								<span class="block text-xs text-muted-foreground">Nr. {o.tracking_number}</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-sm text-muted-foreground-1">
							{o.payment_provider_label || o.payment_provider || '—'}
							{#if o.payment_status_label}
								<span class="block text-xs text-muted-foreground">{o.payment_status_label}</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-right text-sm font-semibold text-foreground"
							>{formatMoney(o.order_total)}</td
						>
						<td class="px-4 py-3 text-right">
							<a
								href="/paskyra/uzsakymai/{o.id}"
								class="inline-flex items-center gap-x-1 text-sm font-medium text-primary hover:underline"
								>Detales <ChevronRight class="size-4" /></a
							>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="mt-6 rounded-xl border border-dashed border-layer-line py-16 text-center">
		<Package class="mx-auto size-10 text-muted-foreground" />
		<p class="mt-3 text-sm text-muted-foreground-1">Užsakymų dar nėra.</p>
		<a href="/katalogas" class="mt-2 inline-block text-sm font-medium text-primary"
			>Pereiti į katalogą →</a
		>
	</div>
{/if}
