<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { GiftCardOut } from '#lib/api/types';
	import { Gift, Plus, SearchCheck } from '@lucide/svelte';

	let { data } = $props();
	const cards = $derived(data.cards ?? []);

	function fmtDate(iso: string | null): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}

	const statusLabel: Record<string, string> = {
		active: 'Aktyvi',
		depleted: 'Išnaudota',
		voided: 'Anuliuota'
	};
	const statusColor: Record<string, string> = {
		active: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
		depleted: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
		voided: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
	};

	// Dovanų kortelės kodas = mokėjimo priemonė (ne nuolaidos kodas):
	// redeem priskiria kortelę paskyrai, checkout'e renkamasi payment_method=gift_card.
	let code = $state('');
	let busy = $state(false);
	let msg = $state('');
	let msgOk = $state(false);
	let checked = $state<GiftCardOut | null>(null);

	async function call(path: string) {
		const res = await fetch(`/api/v1/giftcards/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ code: code.trim() })
		});
		const b = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(b?.detail || 'Klaida');
		return b as GiftCardOut;
	}

	async function redeem() {
		if (!code.trim()) return;
		busy = true;
		msg = '';
		checked = null;
		try {
			const c = await call('redeem');
			msg = `Kortelė pridėta — likutis ${c.balance} ${c.currency}.`;
			msgOk = true;
			code = '';
			await invalidateAll();
		} catch (e) {
			msg = e instanceof Error ? e.message : 'Nepavyko pridėti kortelės';
			msgOk = false;
		} finally {
			busy = false;
		}
	}

	async function check() {
		if (!code.trim()) return;
		busy = true;
		msg = '';
		checked = null;
		try {
			checked = await call('check');
		} catch (e) {
			msg = e instanceof Error ? e.message : 'Nepavyko patikrinti kortelės';
			msgOk = false;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Dovanų kortelės — Baltijos Žvynas</title>
</svelte:head>

<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
	<Gift class="size-6" /> Dovanų kortelės
</h1>
<p class="mt-1 text-sm text-muted-foreground-1">
	Dovanų kortelė yra mokėjimo priemonė — jos likutis nurašomas apmokėjimo metu
	(ne nuolaidos kodas).
</p>

<!-- Kortelės -->
<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each cards as c (c.code)}
		<div class="rounded-xl border border-card-line bg-card p-5">
			<div class="flex items-start justify-between">
				<p class="font-mono text-sm tracking-wider text-foreground">{c.code}</p>
				<span
					class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {statusColor[
						c.status
					] ?? ''}"
				>
					{statusLabel[c.status] ?? c.status}
				</span>
			</div>
			<p class="mt-3 text-3xl font-bold text-foreground">
				{c.balance} <span class="text-base font-medium text-muted-foreground-1">{c.currency}</span>
			</p>
			<p class="mt-1 text-xs text-muted-foreground-1">
				Pradinė vertė {c.initial_amount} {c.currency}
				{#if c.expires_at} · galioja iki {fmtDate(c.expires_at)}{/if}
			</p>
		</div>
	{:else}
		<div
			class="col-span-full rounded-xl border border-dashed border-layer-line py-12 text-center"
		>
			<Gift class="mx-auto size-10 text-muted-foreground" />
			<p class="mt-3 text-sm text-muted-foreground-1">
				Su paskyra susietų dovanų kortelių nėra. Pridėkite kortelę žemiau arba
				naudokite kodą tiesiogiai checkout'e.
			</p>
		</div>
	{/each}
</div>

<!-- Pridėti / patikrinti -->
<div class="mt-6 rounded-xl border border-card-line bg-card p-5">
	<h2 class="font-semibold text-foreground">Pridėti arba patikrinti kortelę</h2>
	<p class="mt-1 text-xs text-muted-foreground-1">
		Įveskite kortelės kodą. „Pridėti" susieja kortelę su paskyra; „Tikrinti" rodo
		likutį nepriskiriant.
	</p>
	<div class="mt-4 flex flex-col gap-2 sm:flex-row">
		<input
			bind:value={code}
			placeholder="Kortelės kodas"
			class="w-full flex-1 rounded-lg border border-layer-line bg-layer px-3 py-2.5 font-mono text-sm uppercase tracking-wider text-foreground"
		/>
		<button
			type="button"
			onclick={check}
			disabled={busy || !code.trim()}
			class="inline-flex items-center justify-center gap-x-1.5 rounded-lg border border-layer-line px-4 py-2.5 text-sm font-medium text-foreground hover:bg-layer-hover disabled:opacity-50"
		>
			<SearchCheck class="size-4" /> Tikrinti
		</button>
		<button
			type="button"
			onclick={redeem}
			disabled={busy || !code.trim()}
			class="inline-flex items-center justify-center gap-x-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
		>
			<Plus class="size-4" /> Pridėti
		</button>
	</div>
	{#if checked}
		<p class="mt-3 text-sm text-foreground">
			Likutis: <strong>{checked.balance} {checked.currency}</strong>
			{#if checked.expires_at} · galioja iki {fmtDate(checked.expires_at)}{/if}
		</p>
	{/if}
	{#if msg}
		<p class="mt-3 text-sm {msgOk ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
			{msg}
		</p>
	{/if}
</div>

<div class="mt-4 rounded-xl border border-layer-line bg-layer p-4 text-sm text-muted-foreground-1">
	Apmokėjimo metu pasirinkite „Dovanų kortelė" ir įveskite kodą — kortelės likutis
	padengs visą užsakymo sumą (jei likutis mažesnis, užsakymas nebus sukurtas;
	dalinis dengimas su kitu mokėjimo būdu — planuojama).
</div>
