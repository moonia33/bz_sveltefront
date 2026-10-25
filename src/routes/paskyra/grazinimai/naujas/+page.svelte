<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import { ArrowLeft, Undo2 } from '@lucide/svelte';

	let { data } = $props();
	const order = $derived(data.order);
	const returnableOrders = $derived(data.returnableOrders ?? []);

	// Kiekvienai grąžinamai eilutei — pasirinktas kiekis (0 = negrąžinti) + priežastis.
	type Sel = { qty: number; reason: string };
	let selected = $state<Record<number, Sel>>({});
	let note = $state('');
	let busy = $state(false);
	let err = $state('');

	const returnableLines = $derived(
		(order?.items ?? []).filter((l) => l.returnable && l.qty - (l.returned_qty ?? 0) > 0)
	);

	const totalLines = $derived(
		Object.values(selected).filter((s) => s.qty > 0).length
	);

	function setQty(lineId: number, qty: number, max: number) {
		const q = Math.max(0, Math.min(max, Math.trunc(qty) || 0));
		const cur = selected[lineId] ?? { qty: 0, reason: '' };
		selected = { ...selected, [lineId]: { ...cur, qty: q } };
	}

	function setReason(lineId: number, reason: string) {
		const cur = selected[lineId] ?? { qty: 0, reason: '' };
		selected = { ...selected, [lineId]: { ...cur, reason } };
	}

	async function submit() {
		if (!order || totalLines === 0) return;
		busy = true;
		err = '';
		try {
			const lines = returnableLines
				.map((l) => ({
					order_line_id: l.id,
					qty: selected[l.id]?.qty ?? 0,
					reason: selected[l.id]?.reason ?? ''
				}))
				.filter((l) => l.qty > 0);
			const res = await fetch(`/api/v1/checkout/orders/${order.id}/returns`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ lines, note: note.trim() })
			});
			const b = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(b?.detail || 'Nepavyko sukurti grąžinimo');
			await goto(`/paskyra/grazinimai/${b.id}`);
		} catch (e) {
			err = e instanceof Error ? e.message : 'Nepavyko sukurti grąžinimo';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Naujas grąžinimas — Baltijos Žvynas</title>
</svelte:head>

<a
	href="/paskyra/grazinimai"
	class="inline-flex items-center gap-x-1 text-sm text-muted-foreground-1 hover:text-foreground"
>
	<ArrowLeft class="size-4" /> Grąžinimai
</a>

<h1 class="mt-3 flex items-center gap-x-2 text-2xl font-bold text-foreground">
	<Undo2 class="size-6" /> Naujas grąžinimas
</h1>

{#if !order && returnableOrders.length > 1}
	<p class="mt-4 text-sm text-muted-foreground-1">Pasirinkite užsakymą:</p>
	<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each returnableOrders as o (o.id)}
			<a
				href="/paskyra/grazinimai/naujas?order={o.id}"
				class="rounded-xl border border-card-line bg-card p-4 hover:border-primary/40 hover:bg-layer-hover"
			>
				<p class="text-sm font-medium text-foreground">Užsakymas #{o.id}</p>
				<p class="text-xs text-muted-foreground-1">{o.items?.length ?? 0} eilučių</p>
			</a>
		{/each}
	</div>
{:else if order}
	<p class="mt-1 text-sm text-muted-foreground-1">
		Užsakymas <a href="/paskyra/uzsakymai/{order.id}" class="text-primary hover:underline"
			>#{order.id}</a
		> — pažymėkite grąžinamas eilutes ir kiekius. Prašymas bus peržiūrėtas ir
		patvirtintas.
	</p>

	<div class="mt-6 overflow-hidden rounded-xl border border-card-line bg-card">
		<table class="min-w-full divide-y divide-card-line">
			<thead class="bg-card-header">
				<tr>
					<th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Prekė</th
					>
					<th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Lieka grąžinti</th
					>
					<th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted-foreground-1"
						>Kiekis</th
					>
					<th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted-foreground-1"
						>Priežastis</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-card-line">
				{#each returnableLines as l (l.id)}
					{@const remaining = l.qty - (l.returned_qty ?? 0)}
					<tr>
						<td class="px-5 py-3">
							<p class="text-sm font-medium text-foreground">{l.name}</p>
							<p class="text-xs text-muted-foreground-1">
								SKU {l.sku} · {formatMoney(l.unit_price)}
								{#if l.return_days}· grąžinimo langas {l.return_days} d.{/if}
							</p>
						</td>
						<td class="px-5 py-3 text-right text-sm text-muted-foreground-1">
							{remaining} / {l.qty}
						</td>
						<td class="px-5 py-3 text-right">
							<input
								type="number"
								min="0"
								max={remaining}
								value={selected[l.id]?.qty ?? 0}
								oninput={(e) =>
									setQty(l.id, Number((e.target as HTMLInputElement).value), remaining)}
								class="w-20 rounded-lg border border-layer-line bg-layer px-2 py-1.5 text-right text-sm text-foreground"
							/>
						</td>
						<td class="px-5 py-3">
							<input
								type="text"
								placeholder="pvz., netinka dydis"
								value={selected[l.id]?.reason ?? ''}
								oninput={(e) => setReason(l.id, (e.target as HTMLInputElement).value)}
								class="w-full min-w-40 rounded-lg border border-layer-line bg-layer px-2 py-1.5 text-sm text-foreground"
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if (order.items ?? []).some((l) => !l.returnable)}
			<p class="border-t border-card-line px-5 py-3 text-xs text-muted-foreground-1">
				Kai kurios eilutės nerodytos — jos pažymėtos kaip negrąžinamos.
			</p>
		{/if}
	</div>

	<div class="mt-4">
		<label for="rma-note" class="mb-1 block text-sm font-medium text-foreground"
			>Papildomas komentaras</label
		>
		<textarea
			id="rma-note"
			bind:value={note}
			rows="3"
			class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
		></textarea>
	</div>

	{#if err}
		<p class="mt-3 text-sm text-red-600 dark:text-red-400">{err}</p>
	{/if}

	<div class="mt-5 flex justify-end">
		<button
			type="button"
			onclick={submit}
			disabled={busy || totalLines === 0}
			class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
		>
			<Undo2 class="size-4" />
			{busy ? 'Siunčiama…' : `Pateikti grąžinimą (${totalLines} eil.)`}
		</button>
	</div>
{:else}
	<div class="mt-6 rounded-xl border border-dashed border-layer-line py-16 text-center">
		<p class="text-sm text-muted-foreground-1">
			Šiuo metu nėra užsakymų, iš kurių būtų galima grąžinti prekes.
		</p>
		<a href="/grazinimas" class="mt-2 inline-block text-sm font-medium text-primary"
			>Grąžinimo taisyklės →</a
		>
	</div>
{/if}
