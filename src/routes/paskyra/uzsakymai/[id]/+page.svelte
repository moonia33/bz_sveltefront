<script lang="ts">
	import { formatMoney } from '#lib/money';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import {
		ArrowLeft,
		CalendarClock,
		FileText,
		Package,
		Truck,
		Undo2,
		Wallet
	} from '@lucide/svelte';

	let { data } = $props();
	const o = $derived(data.order);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	const statusColor: Record<string, string> = {
		paid: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
		completed: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		pending_payment: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
		delivered: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
	};

	// Grąžinti galima kai pristatyta ir yra grąžinamų eilučių su likusiu kiekiu.
	const canReturn = $derived(
		Boolean(o.delivered_at) &&
			(o.items ?? []).some((l) => l.returnable && l.qty - (l.returned_qty ?? 0) > 0)
	);
	const invoiceUrl = $derived(`/api/v1/checkout/orders/${o.id}/invoice`);
</script>

<svelte:head>
	<title>Užsakymas #{o.id} — Baltijos Žvynas</title>
</svelte:head>

<a
	href="/paskyra/uzsakymai"
	class="inline-flex items-center gap-x-1 text-sm text-muted-foreground-1 hover:text-foreground"
>
	<ArrowLeft class="size-4" /> Visi užsakymai
</a>

<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Užsakymas #{o.id}</h1>
		<p class="mt-1 text-sm text-muted-foreground-1">{fmtDate(o.created_at)}</p>
	</div>
	<div class="flex flex-wrap items-center gap-2">
		<span
			class="inline-flex rounded-full px-3 py-1 text-xs font-medium {statusColor[o.status] ??
				'bg-gray-100 text-gray-600'}"
		>
			{o.status_label || o.status}
		</span>
		{#if o.payment_status_label}
			<span
				class="inline-flex rounded-full px-3 py-1 text-xs font-medium {statusColor[
					o.payment_status
				] ?? 'bg-gray-100 text-gray-600'}"
			>
				{o.payment_status_label}
			</span>
		{/if}
	</div>
</div>

<!-- Mokėjimo instrukcijos (banko pavedimas) arba pakartotinis apmokėjimas -->
{#if o.status === 'pending_payment'}
	<div
		class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10"
	>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="min-w-0">
				{#if o.payment_instructions}
					<p class="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-200">
						{o.payment_instructions}
					</p>
				{:else}
					<p class="text-sm text-amber-900 dark:text-amber-200">
						Užsakymas laukia apmokėjimo.
					</p>
				{/if}
			</div>
			{#if o.payment_redirect_url}
				<a
					href={o.payment_redirect_url}
					class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
				>
					<Wallet class="size-4" /> Tęsti apmokėjimą
				</a>
			{/if}
		</div>
	</div>
{/if}

<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
	<div class="space-y-6">
		<!-- Eilutės -->
		<div class="overflow-hidden rounded-xl border border-card-line bg-card">
			<div class="border-b border-card-line bg-card-header px-5 py-3">
				<h2 class="flex items-center gap-x-2 font-semibold text-foreground">
					<Package class="size-4" /> Prekės
				</h2>
			</div>
			<ul class="divide-y divide-card-line">
				{#each o.items ?? [] as l (l.id)}
					<li class="px-5 py-4">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-sm font-medium text-foreground">{l.name}</p>
								<p class="mt-0.5 text-xs text-muted-foreground-1">
									SKU {l.sku} · {l.qty} × {formatMoney(l.unit_price)}
								</p>
								{#if !l.returnable}
									<p class="mt-1 text-xs text-muted-foreground">Negrąžinama prekė</p>
								{:else if (l.returned_qty ?? 0) > 0}
									<p class="mt-1 text-xs text-muted-foreground">
										Grąžinta: {l.returned_qty} vnt.
									</p>
								{/if}
								{#if l.delivery_window}
									<p class="mt-1 inline-flex items-center gap-x-1 text-xs text-muted-foreground-1">
										<CalendarClock class="size-3" />
										{fmtDate(l.delivery_window.min_date)}–{fmtDate(
											l.delivery_window.max_date
										)}
									</p>
								{/if}
							</div>
							<p class="shrink-0 text-sm font-semibold text-foreground">
								{formatMoney(l.line_total)}
							</p>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Pristatymas -->
		<div class="rounded-xl border border-card-line bg-card p-5">
			<h2 class="flex items-center gap-x-2 font-semibold text-foreground">
				<Truck class="size-4" /> Pristatymas
			</h2>
			<dl class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Būdas</dt>
					<dd class="text-foreground">
						{o.shipping_method}{o.carrier_code ? ` (${o.carrier_code})` : ''}
					</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Būsena</dt>
					<dd class="text-foreground">{o.delivery_status_label || o.delivery_status || '—'}</dd>
				</div>
				{#if o.tracking_number}
					<div class="flex justify-between">
						<dt class="text-muted-foreground-1">Siuntos nr.</dt>
						<dd class="font-mono text-foreground">{o.tracking_number}</dd>
					</div>
				{/if}
				{#if o.delivery_window}
					<div class="flex justify-between">
						<dt class="text-muted-foreground-1">Numatomas pristatymas</dt>
						<dd class="text-foreground">
							{fmtDate(o.delivery_window.min_date)}–{fmtDate(o.delivery_window.max_date)}
						</dd>
					</div>
				{/if}
				{#if o.delivered_at}
					<div class="flex justify-between">
						<dt class="text-muted-foreground-1">Pristatyta</dt>
						<dd class="text-foreground">{fmtDate(o.delivered_at)}</dd>
					</div>
				{/if}
				{#if o.fulfillment_mode_label}
					<div class="flex justify-between">
						<dt class="text-muted-foreground-1">Išsiuntimas iš</dt>
						<dd class="text-foreground">{o.fulfillment_mode_label}</dd>
					</div>
				{/if}
				{#if o.supplier_reservation_status_label}
					<div class="flex justify-between">
						<dt class="text-muted-foreground-1">Tiekėjo rezervacija</dt>
						<dd class="text-foreground">{o.supplier_reservation_status_label}</dd>
					</div>
				{/if}
			</dl>
		</div>
	</div>

	<!-- Suvestinė -->
	<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
		<div class="rounded-xl border border-card-line bg-card p-5">
			<h2 class="font-semibold text-foreground">Suvestinė</h2>
			<dl class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Prekės</dt>
					<dd class="text-foreground">{formatMoney(o.items_total)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Pristatymas</dt>
					<dd class="text-foreground">
						{o.shipping_total?.gross === 0 ? 'Nemokamas' : formatMoney(o.shipping_total)}
					</dd>
				</div>
				{#if o.fees?.length}
					{#each o.fees as f (f.code)}
						<div class="flex justify-between">
							<dt class="text-muted-foreground-1">{f.name}</dt>
							<dd class="text-foreground">{formatMoney(f.amount)}</dd>
						</div>
					{/each}
				{/if}
				{#if o.discount_total?.gross}
					<div class="flex justify-between text-green-600 dark:text-green-400">
						<dt>Nuolaida</dt>
						<dd>−{formatMoney(o.discount_total)}</dd>
					</div>
				{/if}
				<div
					class="flex justify-between border-t border-card-line pt-2 text-base font-bold text-foreground"
				>
					<dt>Iš viso</dt>
					<dd>{formatMoney(o.order_total)}</dd>
				</div>
			</dl>
			<p class="mt-3 text-xs text-muted-foreground-1">
				{o.payment_provider_label || o.payment_provider || ''}
			</p>
		</div>

		{#if o.invoice_number}
			<a
				href={invoiceUrl}
				target="_blank"
				rel="noopener"
				class="flex items-center justify-center gap-x-2 rounded-xl border border-layer-line px-4 py-3 text-sm font-medium text-foreground hover:bg-layer-hover"
			>
				<FileText class="size-4" /> Sąskaita {o.invoice_number}
			</a>
		{/if}

		{#if canReturn}
			<a
				href="/paskyra/grazinimai/naujas?order={o.id}"
				class="flex items-center justify-center gap-x-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary-hover"
			>
				<Undo2 class="size-4" /> Inicijuoti grąžinimą
			</a>
		{:else if o.delivered_at}
			<div class="flex justify-center">
				<MissingFeature
					feature="Grąžinimas nebegalimas (langas pasibaigęs arba visos eilutės grąžintos)"
				/>
			</div>
		{/if}
	</aside>
</div>
