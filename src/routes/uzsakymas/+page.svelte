<script lang="ts">
	import { formatMoney } from '#lib/money';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const o = $derived(data.order);

	const paid = $derived(
		o.payment_status === 'paid' || o.payment_status === 'settled' || o.payment_status === 'succeeded'
	);
	const pendingRedirect = $derived(
		!paid && (o.payment_redirect_url || '').length > 0
	);

	function fmtDate(iso: string): string {
		try {
			return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'long' }).format(
				new Date(iso)
			);
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Užsakymas #{o.id} — Baltijos žvynas</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
	<!-- Antraštė -->
	<div class="text-center">
		<span
			class="mx-auto flex size-14 items-center justify-center rounded-full {paid
				? 'bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400'
				: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}"
		>
			{#if paid}
				<svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			{:else}
				<svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			{/if}
		</span>
		<h1 class="mt-4 text-2xl font-semibold text-foreground sm:text-3xl">
			{paid ? 'Ačiū! Užsakymas apmokėtas' : 'Ačiū! Užsakymas priimtas'}
		</h1>
		<p class="mt-2 text-muted-foreground">
			Užsakymo numeris <span class="font-medium text-foreground">#{o.id}</span>
			· {fmtDate(o.created_at)}
		</p>
		<div class="mt-3 flex flex-wrap items-center justify-center gap-2">
			{#if o.payment_status_label}
				<span
					class="inline-flex items-center gap-x-1.5 rounded-full px-3 py-1 text-xs font-medium {paid
						? 'bg-teal-100 text-teal-800 dark:bg-teal-500/10 dark:text-teal-400'
						: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400'}"
				>
					{o.payment_provider_label ? `${o.payment_provider_label}: ` : ''}{o.payment_status_label}
				</span>
			{/if}
			<span class="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
				{o.status_label}
			</span>
		</div>
	</div>

	<!-- Banko pavedimo instrukcijos / nepabaigtas mokėjimas -->
	{#if !paid && o.payment_instructions}
		<div class="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
			<h2 class="text-sm font-semibold text-amber-900 dark:text-amber-300">
				Apmokėjimo instrukcijos
			</h2>
			<p class="mt-2 whitespace-pre-line text-sm text-amber-800 dark:text-amber-200/90">
				{o.payment_instructions}
			</p>
		</div>
	{/if}

	{#if pendingRedirect}
		<div class="mt-6 text-center">
			<a
				href={o.payment_redirect_url}
				class="inline-flex items-center gap-x-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
			>
				Tęsti apmokėjimą
			</a>
			<p class="mt-2 text-xs text-muted-foreground">
				Jei mokėjimas nebuvo užbaigtas — galite jį tęsti čia.
			</p>
		</div>
	{/if}

	<div class="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Prekės -->
		<div class="rounded-xl border border-border bg-card p-5 lg:col-span-2">
			<h2 class="text-sm font-semibold text-foreground">Užsakytos prekės</h2>
			<ul class="mt-4 divide-y divide-border">
				{#each o.items as item (item.id)}
					<li class="flex items-start justify-between gap-x-4 py-3 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<p class="text-sm font-medium text-foreground">{item.name}</p>
							<p class="mt-0.5 text-xs text-muted-foreground">
								{item.sku} · {item.qty} × {formatMoney(item.unit_price)}
							</p>
							{#if item.delivery_window}
								<p class="mt-0.5 text-xs text-muted-foreground">
									Pristatymas: {fmtDate(item.delivery_window.min_date)} – {fmtDate(item.delivery_window.max_date)}
								</p>
							{/if}
						</div>
						<p class="shrink-0 text-sm font-medium text-foreground">
							{formatMoney(item.line_total)}
						</p>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Suvestinė -->
		<div class="space-y-6">
			<div class="rounded-xl border border-border bg-card p-5">
				<h2 class="text-sm font-semibold text-foreground">Suvestinė</h2>
				<dl class="mt-4 space-y-2.5 text-sm">
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Prekės</dt>
						<dd class="font-medium text-foreground">{formatMoney(o.items_total)}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Pristatymas</dt>
						<dd class="font-medium text-foreground">
							{o.shipping_total.gross > 0 ? formatMoney(o.shipping_total) : 'Nemokamas'}
						</dd>
					</div>
					{#each o.fees as fee (fee.code)}
						<div class="flex justify-between">
							<dt class="text-muted-foreground">{fee.name}</dt>
							<dd class="font-medium text-foreground">{formatMoney(fee.amount)}</dd>
						</div>
					{/each}
					{#if o.discount_total.gross > 0}
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Nuolaida</dt>
							<dd class="font-medium text-teal-600 dark:text-teal-400">
								−{formatMoney(o.discount_total)}
							</dd>
						</div>
					{/if}
					<div class="flex justify-between border-t border-border pt-2.5">
						<dt class="font-semibold text-foreground">Iš viso</dt>
						<dd class="font-semibold text-foreground">{formatMoney(o.order_total)}</dd>
					</div>
					{#if Number(o.gift_card_amount) > 0}
						<div class="flex justify-between">
							<dt class="text-muted-foreground">Apmokėta dovanų kortele</dt>
							<dd class="font-medium text-teal-600 dark:text-teal-400">
								{Number(o.gift_card_amount).toFixed(2)} €
							</dd>
						</div>
						{#if Number(o.provider_amount) > 0}
							<div class="flex justify-between">
								<dt class="text-muted-foreground">Apmokėta ({o.payment_provider_label})</dt>
								<dd class="font-medium text-foreground">
									{Number(o.provider_amount).toFixed(2)} €
								</dd>
							</div>
						{/if}
					{/if}
				</dl>
			</div>

			<!-- Pristatymas -->
			<div class="rounded-xl border border-border bg-card p-5">
				<h2 class="text-sm font-semibold text-foreground">Pristatymas</h2>
				<dl class="mt-4 space-y-2.5 text-sm">
					<div class="flex justify-between gap-x-3">
						<dt class="text-muted-foreground">Būdas</dt>
						<dd class="text-right font-medium text-foreground">
							{o.shipping_method === 'digital' ? 'El. paštas (skaitmeninis)' : o.shipping_method}
						</dd>
					</div>
					{#if o.shipping_method === 'digital'}
						<div class="flex justify-between gap-x-3">
							<dt class="text-muted-foreground">Numatomas</dt>
							<dd class="text-right font-medium text-foreground">Iškart po apmokėjimo</dd>
						</div>
					{:else if o.delivery_window}
						<div class="flex justify-between gap-x-3">
							<dt class="text-muted-foreground">Numatomas</dt>
							<dd class="text-right font-medium text-foreground">
								{fmtDate(o.delivery_window.min_date)} – {fmtDate(o.delivery_window.max_date)}
							</dd>
						</div>
					{/if}
					<div class="flex justify-between gap-x-3">
						<dt class="text-muted-foreground">Būsena</dt>
						<dd class="text-right font-medium text-foreground">{o.delivery_status_label}</dd>
					</div>
					{#if o.tracking_number}
						<div class="flex justify-between gap-x-3">
							<dt class="text-muted-foreground">Siuntos nr.</dt>
							<dd class="text-right font-medium text-foreground">{o.tracking_number}</dd>
						</div>
					{/if}
				</dl>
			</div>
		</div>
	</div>

	<!-- Veiksmai -->
	<div class="mt-10 flex flex-wrap items-center justify-center gap-3">
		<a
			href="/paskyra"
			class="inline-flex items-center gap-x-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
		>
			Mano užsakymai
		</a>
		<a
			href="/katalogas"
			class="inline-flex items-center gap-x-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
		>
			Tęsti apsipirkimą
		</a>
	</div>
</div>
