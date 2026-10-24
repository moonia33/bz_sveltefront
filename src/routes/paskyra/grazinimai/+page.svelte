<script lang="ts">
	import { ChevronRight, Package, Undo2 } from '@lucide/svelte';

	let { data } = $props();
	const returns = $derived(data.returns ?? []);
	const returnableOrders = $derived(data.returnableOrders ?? []);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	const statusColor: Record<string, string> = {
		pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
		approved: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
		rejected: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
		received: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
		completed: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
	};
</script>

<svelte:head>
	<title>Grąžinimai — Baltijos Žvynas</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
			<Undo2 class="size-6" /> Grąžinimai
		</h1>
		<p class="mt-1 text-sm text-muted-foreground-1">
			RMA prašymai ir jų būsenos — nuo sukūrimo iki kreditinės sąskaitos.
		</p>
	</div>
	{#if returnableOrders.length}
		<a
			href="/paskyra/grazinimai/naujas"
			class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
		>
			<Undo2 class="size-4" /> Naujas grąžinimas
		</a>
	{/if}
</div>

{#if returns.length}
	<div class="mt-6 overflow-x-auto rounded-xl border border-card-line">
		<table class="min-w-full divide-y divide-card-line">
			<thead class="bg-card-header">
				<tr>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>RMA</th
					>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Užsakymas</th
					>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Sukurta</th
					>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Būsena</th
					>
					<th class="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Prekės</th
					>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-card-line bg-card">
				{#each returns as r (r.id)}
					<tr>
						<td class="px-4 py-3 font-mono text-sm font-medium text-foreground">{r.number}</td>
						<td class="px-4 py-3 text-sm text-muted-foreground-1">
							<a href="/paskyra/uzsakymai/{r.order_id}" class="text-primary hover:underline"
								>#{r.order_id}</a
							>
						</td>
						<td class="px-4 py-3 text-sm text-muted-foreground-1">{fmtDate(r.created_at)}</td>
						<td class="px-4 py-3">
							<span
								class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColor[
									r.status
								] ?? 'bg-gray-100 text-gray-600'}"
							>
								{r.status_label || r.status}
							</span>
						</td>
						<td class="px-4 py-3 text-sm text-muted-foreground-1">
							{r.lines?.reduce((s, l) => s + l.qty, 0) ?? 0} vnt.
						</td>
						<td class="px-4 py-3 text-right">
							<a
								href="/paskyra/grazinimai/{r.id}"
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
		<p class="mt-3 text-sm text-muted-foreground-1">Grąžinimų prašymų nėra.</p>
		{#if returnableOrders.length}
			<a href="/paskyra/grazinimai/naujas" class="mt-2 inline-block text-sm font-medium text-primary"
				>Inicijuoti grąžinimą →</a
			>
		{/if}
	</div>
{/if}

{#if returnableOrders.length}
	<div class="mt-8">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground-1">
			Galima grąžinti iš šių užsakymų
		</h2>
		<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each returnableOrders as o (o.id)}
				<a
					href="/paskyra/grazinimai/naujas?order={o.id}"
					class="flex items-center justify-between rounded-xl border border-card-line bg-card p-4 hover:border-primary/40 hover:bg-layer-hover"
				>
					<div>
						<p class="text-sm font-medium text-foreground">Užsakymas #{o.id}</p>
						<p class="text-xs text-muted-foreground-1">
							pristatytas {fmtDate(o.delivered_at)}
						</p>
					</div>
					<ChevronRight class="size-4 text-muted-foreground-1" />
				</a>
			{/each}
		</div>
	</div>
{/if}
