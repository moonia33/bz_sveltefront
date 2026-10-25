<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ArrowLeft, FileText, PackageX, Truck, Undo2 } from '@lucide/svelte';

	let { data } = $props();
	const r = $derived(data.ret);

	function fmtDate(iso: string): string {
		if (!iso) return '—';
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

	const canCancel = $derived(r.status === 'pending' || r.status === 'approved');

	// Būsenų eiga (timeline) — supaprastinta Preline RMA versija su tikrais statusais.
	const steps = $derived([
		{ key: 'created', label: 'Pateikta', at: r.created_at, done: true },
		{
			key: 'decided',
			label: r.status === 'rejected' ? 'Atmesta' : 'Patvirtinta',
			at: r.decided_at,
			done: Boolean(r.decided_at)
		},
		{
			key: 'received',
			label: 'Prekės gautos',
			at: r.received_at,
			done: Boolean(r.received_at)
		},
		{
			key: 'completed',
			label: 'Kreditas išrašytas',
			at: r.completed_at,
			done: Boolean(r.completed_at)
		}
	]);

	let cancelBusy = $state(false);
	let cancelErr = $state('');
	async function cancel() {
		if (!confirm(`Atšaukti grąžinimą ${r.number}?`)) return;
		cancelBusy = true;
		cancelErr = '';
		try {
			const res = await fetch(`/api/v1/checkout/returns/${r.id}/cancel`, {
				method: 'POST'
			});
			if (!res.ok) {
				const b = await res.json().catch(() => ({}));
				throw new Error(b?.detail || 'Nepavyko atšaukti');
			}
			await invalidateAll();
		} catch (e) {
			cancelErr = e instanceof Error ? e.message : 'Nepavyko atšaukti';
		} finally {
			cancelBusy = false;
		}
	}
</script>

<svelte:head>
	<title>Grąžinimas {r.number} — Baltijos Žvynas</title>
</svelte:head>

<a
	href="/paskyra/grazinimai"
	class="inline-flex items-center gap-x-1 text-sm text-muted-foreground-1 hover:text-foreground"
>
	<ArrowLeft class="size-4" /> Visi grąžinimai
</a>

<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
			<Undo2 class="size-6" /> {r.number}
		</h1>
		<p class="mt-1 text-sm text-muted-foreground-1">
			Užsakymas
			<a href="/paskyra/uzsakymai/{r.order_id}" class="text-primary hover:underline"
				>#{r.order_id}</a
			>
		</p>
	</div>
	<span
		class="inline-flex rounded-full px-3 py-1 text-xs font-medium {statusColor[r.status] ??
			'bg-gray-100 text-gray-600'}"
	>
		{r.status_label || r.status}
	</span>
</div>

<!-- Timeline -->
<div class="mt-6 rounded-xl border border-card-line bg-card p-5">
	<ol class="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-4">
		{#each steps as s, i (s.key)}
			<li class="relative flex-1 pb-6 sm:pb-0">
				<div class="flex items-center gap-x-2">
					<span
						class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {s.done
							? 'bg-primary text-primary-foreground'
							: 'bg-layer-line text-muted-foreground-1'}"
					>
						{i + 1}
					</span>
					<div>
						<p class="text-sm font-medium {s.done ? 'text-foreground' : 'text-muted-foreground-1'}">
							{s.label}
						</p>
						<p class="text-xs text-muted-foreground">{fmtDate(s.at)}</p>
					</div>
				</div>
			</li>
		{/each}
	</ol>
	{#if r.status === 'cancelled' || r.status === 'rejected'}
		<p class="mt-2 text-sm text-muted-foreground-1">
			{r.status === 'cancelled' ? 'Grąžinimas atšauktas.' : 'Grąžinimas atmestas.'}
		</p>
	{/if}
</div>

<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
	<!-- Eilutės -->
	<div class="overflow-hidden rounded-xl border border-card-line bg-card">
		<div class="border-b border-card-line bg-card-header px-5 py-3">
			<h2 class="font-semibold text-foreground">Grąžinamos prekės</h2>
		</div>
		<table class="min-w-full divide-y divide-card-line">
			<thead>
				<tr>
					<th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Prekė</th
					>
					<th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Grąžinama</th
					>
					<th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Gauta</th
					>
					<th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Kredituota</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-card-line">
				{#each r.lines as l (l.id)}
					<tr>
						<td class="px-5 py-3">
							<p class="text-sm font-medium text-foreground">{l.name}</p>
							<p class="text-xs text-muted-foreground-1">
								SKU {l.sku}{l.reason ? ` · ${l.reason}` : ''}
							</p>
						</td>
						<td class="px-5 py-3 text-right text-sm text-foreground">{l.qty}</td>
						<td class="px-5 py-3 text-right text-sm text-muted-foreground-1">{l.received_qty}</td>
						<td class="px-5 py-3 text-right text-sm text-muted-foreground-1">{l.credited_qty}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if r.note}
			<p class="border-t border-card-line px-5 py-3 text-sm text-muted-foreground-1">
				<span class="font-medium text-foreground">Komentaras:</span> {r.note}
			</p>
		{/if}
	</div>

	<!-- Šoninis blokas -->
	<aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
		<div class="rounded-xl border border-card-line bg-card p-5">
			<h2 class="font-semibold text-foreground">Informacija</h2>
			<dl class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Sukurta</dt>
					<dd class="text-foreground">{fmtDate(r.created_at)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-muted-foreground-1">Sprendimas</dt>
					<dd class="text-foreground">{fmtDate(r.decided_at)}</dd>
				</div>
				{#if r.tracking_number}
					<div class="flex justify-between">
						<dt class="flex items-center gap-x-1 text-muted-foreground-1"
							><Truck class="size-3.5" /> Grąžinimo siunta</dt
						>
						<dd class="font-mono text-foreground">{r.tracking_number}</dd>
					</div>
				{/if}
				{#if r.credit_invoice_number}
					<div class="flex justify-between">
						<dt class="flex items-center gap-x-1 text-muted-foreground-1"
							><FileText class="size-3.5" /> Kreditinė</dt
						>
						<dd class="text-foreground">{r.credit_invoice_number}</dd>
					</div>
				{/if}
			</dl>
			<p class="mt-3 text-xs text-muted-foreground-1">
				Pinigų grąžinimas vykdomas po kreditinės sąskaitos — tai ne automatinis
				procesas, apie jį informuosime el. paštu.
			</p>
		</div>

		{#if canCancel}
			<button
				type="button"
				onclick={cancel}
				disabled={cancelBusy}
				class="flex w-full items-center justify-center gap-x-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
			>
				<PackageX class="size-4" /> {cancelBusy ? 'Atšaukiama…' : 'Atšaukti grąžinimą'}
			</button>
			{#if cancelErr}
				<p class="text-sm text-red-600 dark:text-red-400">{cancelErr}</p>
			{/if}
		{/if}
	</aside>
</div>
