<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { AddressOut } from '#lib/api/types';
	import { MapPin, Pencil, Plus, Trash2, Truck, X } from '@lucide/svelte';

	let { data } = $props();
	const me = $derived(data.me);
	const addresses = $derived(data.me.addresses ?? []);
	const pickup = $derived(data.me.primary_pickup_point);

	// Paštomato adresas identifikuojamas TIK iš primary_pickup_point —
	// ranka įvesti adresai paštomatais nežymimi (nėra patikimo požymio).
	const pickupStreet = $derived(
		(pickup?.pickup_point_raw as Record<string, string> | undefined)?.address ??
			(pickup?.pickup_point_raw as Record<string, string> | undefined)?.street ??
			''
	);

	let editing = $state<AddressOut | null>(null);
	let showForm = $state(false);
	let busy = $state(false);
	let error = $state('');

	let form = $state({
		label: '',
		full_name: '',
		line1: '',
		city: '',
		postal_code: '',
		country_code: 'LT',
		phone: '',
		company: '',
		company_vat_no: '',
		is_default_shipping: false,
		is_default_billing: false
	});

	function startNew() {
		editing = null;
		form = {
			label: '',
			full_name: me.first_name || me.last_name
				? `${me.first_name} ${me.last_name}`.trim()
				: '',
			line1: '',
			city: '',
			postal_code: '',
			country_code: 'LT',
			phone: '',
			company: '',
			company_vat_no: '',
			is_default_shipping: addresses.length === 0,
			is_default_billing: false
		};
		showForm = true;
		error = '';
	}

	function startEdit(a: AddressOut) {
		editing = a;
		form = {
			label: a.label,
			full_name: a.full_name,
			line1: a.line1,
			city: a.city,
			postal_code: a.postal_code,
			country_code: a.country_code || 'LT',
			phone: a.phone,
			company: a.company,
			company_vat_no: a.company_vat_no,
			is_default_shipping: a.is_default_shipping,
			is_default_billing: a.is_default_billing
		};
		showForm = true;
		error = '';
	}

	async function save() {
		busy = true;
		error = '';
		try {
			const res = await fetch(
				editing ? `/api/v1/auth/addresses/${editing.id}` : '/api/v1/auth/addresses',
				{
					method: editing ? 'PATCH' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form)
				}
			);
			if (!res.ok) {
				const b = await res.json().catch(() => ({}));
				throw new Error(b?.detail || 'Nepavyko išsaugoti adreso');
			}
			showForm = false;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Nepavyko išsaugoti adreso';
		} finally {
			busy = false;
		}
	}

	async function remove(a: AddressOut) {
		if (!confirm(`Ištrinti adresą „${a.label || a.line1}"?`)) return;
		await fetch(`/api/v1/auth/addresses/${a.id}`, { method: 'DELETE' });
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Adresai — Baltijos Žvynas</title>
</svelte:head>

<div class="flex items-center justify-between gap-3">
	<div>
		<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
			<MapPin class="size-6" /> Adresai
		</h1>
		<p class="mt-1 text-sm text-muted-foreground-1">
			Pristatymo ir sąskaitų adresai + numatytasis paštomatas.
		</p>
	</div>
	<button
		type="button"
		onclick={startNew}
		class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
	>
		<Plus class="size-4" /> Naujas adresas
	</button>
</div>

<!-- Paštomatas -->
<div class="mt-6 rounded-xl border border-card-line bg-card p-5">
	<h2 class="flex items-center gap-x-2 font-semibold text-foreground">
		<Truck class="size-4" /> Numatytasis paštomatas
	</h2>
	{#if pickup}
		<div class="mt-3 flex items-start justify-between gap-3">
			<div>
				<p class="text-sm font-medium text-foreground">
					{pickup.pickup_point_name}
					<span
						class="ml-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
						>Paštomatas</span
					>
				</p>
				<p class="mt-0.5 text-sm text-muted-foreground-1">
					{pickupStreet}{pickup.country_code ? `, ${pickup.country_code}` : ''}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">
					{pickup.shipping_method_code} · keičiamas pasirenkant pristatymo būdą checkout'e
				</p>
			</div>
		</div>
	{:else}
		<p class="mt-3 text-sm text-muted-foreground-1">
			Paštomatas nepasirinktas — jis išsaugomas automatiškai pasirinkus paštomatą
			užsakymo metu.
		</p>
	{/if}
</div>

<!-- Adresų sąrašas -->
<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
	{#each addresses as a (a.id)}
		<div class="rounded-xl border border-card-line bg-card p-5">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<p class="text-sm font-semibold text-foreground">
						{a.label || a.full_name || 'Adresas'}
					</p>
					<div class="mt-1 flex flex-wrap gap-1">
						{#if a.is_default_shipping}
							<span
								class="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
								>Numatytasis pristatymo</span
							>
						{/if}
						{#if a.is_default_billing}
							<span
								class="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary"
								>Sąskaitų</span
							>
						{/if}
					</div>
				</div>
				<div class="flex shrink-0 gap-x-1">
					<button
						type="button"
						onclick={() => startEdit(a)}
						class="rounded-lg p-1.5 text-muted-foreground-1 hover:bg-layer-hover hover:text-foreground"
						aria-label="Redaguoti"
					>
						<Pencil class="size-4" />
					</button>
					<button
						type="button"
						onclick={() => remove(a)}
						class="rounded-lg p-1.5 text-muted-foreground-1 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
						aria-label="Ištrinti"
					>
						<Trash2 class="size-4" />
					</button>
				</div>
			</div>
			<p class="mt-2 text-sm text-muted-foreground-1">
				{#if a.company}{a.company}<br />{/if}
				{a.full_name}<br />
				{a.line1}, {a.city} {a.postal_code}, {a.country_code}
				{#if a.phone}<br />{a.phone}{/if}
			</p>
		</div>
	{:else}
		<div
			class="col-span-full rounded-xl border border-dashed border-layer-line py-12 text-center"
		>
			<p class="text-sm text-muted-foreground-1">Adresų dar nėra.</p>
		</div>
	{/each}
</div>

<!-- Forma -->
{#if showForm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div
			class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-card-line bg-card p-6 shadow-xl"
		>
			<div class="flex items-center justify-between">
				<h2 class="font-semibold text-foreground">
					{editing ? 'Redaguoti adresą' : 'Naujas adresas'}
				</h2>
				<button
					type="button"
					onclick={() => (showForm = false)}
					class="rounded-lg p-1 text-muted-foreground-1 hover:text-foreground"
					aria-label="Uždaryti"
				>
					<X class="size-5" />
				</button>
			</div>
			<form class="mt-4 space-y-3" onsubmit={(e) => { e.preventDefault(); save(); }}>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="ad-label" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Pavadinimas</label
						>
						<input
							id="ad-label"
							bind:value={form.label}
							placeholder="Namai / Biuras"
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
					<div>
						<label for="ad-name" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Vardas Pavardė</label
						>
						<input
							id="ad-name"
							bind:value={form.full_name}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
				</div>
				<div>
					<label for="ad-line1" class="mb-1 block text-xs font-medium text-muted-foreground-1"
						>Gatvė, namo/buto nr. *</label
					>
					<input
						id="ad-line1"
						required
						bind:value={form.line1}
						class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
					/>
				</div>
				<div class="grid grid-cols-3 gap-3">
					<div class="col-span-2">
						<label for="ad-city" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Miestas *</label
						>
						<input
							id="ad-city"
							required
							bind:value={form.city}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
					<div>
						<label for="ad-zip" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Pašto kodas *</label
						>
						<input
							id="ad-zip"
							required
							bind:value={form.postal_code}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="ad-phone" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Telefonas</label
						>
						<input
							id="ad-phone"
							bind:value={form.phone}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
					<div>
						<label for="ad-cc" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Šalis</label
						>
						<input
							id="ad-cc"
							bind:value={form.country_code}
							maxlength="2"
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm uppercase text-foreground"
						/>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="ad-company" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>Įmonė (nebūtina)</label
						>
						<input
							id="ad-company"
							bind:value={form.company}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
					<div>
						<label for="ad-vat" class="mb-1 block text-xs font-medium text-muted-foreground-1"
							>PVM kodas</label
						>
						<input
							id="ad-vat"
							bind:value={form.company_vat_no}
							class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground"
						/>
					</div>
				</div>
				<div class="flex gap-6 pt-1">
					<label class="flex items-center gap-x-2 text-sm text-foreground">
						<input type="checkbox" bind:checked={form.is_default_shipping} />
						Numatytasis pristatymo
					</label>
					<label class="flex items-center gap-x-2 text-sm text-foreground">
						<input type="checkbox" bind:checked={form.is_default_billing} />
						Sąskaitų adresas
					</label>
				</div>
				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}
				<div class="flex justify-end gap-x-2 pt-2">
					<button
						type="button"
						onclick={() => (showForm = false)}
						class="rounded-lg border border-layer-line px-4 py-2.5 text-sm font-medium text-foreground hover:bg-layer-hover"
						>Atšaukti</button
					>
					<button
						type="submit"
						disabled={busy}
						class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
						>{busy ? 'Saugoma…' : 'Išsaugoti'}</button
					>
				</div>
			</form>
		</div>
	</div>
{/if}
