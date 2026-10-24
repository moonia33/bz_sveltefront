<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import { Check, Save } from '@lucide/svelte';

	let { data } = $props();
	const me = $derived(data.me);

	let firstName = $state(data.me.first_name ?? '');
	let lastName = $state(data.me.last_name ?? '');
	let phone = $state(
		data.me.phones?.find((p) => p.is_primary)?.phone ?? data.me.phones?.[0]?.phone ?? ''
	);
	let saving = $state(false);
	let saved = $state(false);
	let error = $state('');

	async function save() {
		saving = true;
		error = '';
		saved = false;
		try {
			const res = await fetch('/api/v1/auth/me', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					phone: phone.trim()
				})
			});
			if (!res.ok) {
				const b = await res.json().catch(() => ({}));
				throw new Error(b?.detail || 'Nepavyko išsaugoti');
			}
			saved = true;
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Nepavyko išsaugoti';
		} finally {
			saving = false;
		}
	}

	// Sutikimai — PUT /auth/consents {items:[{key, accepted}]}
	let consentsSaving = $state<string | null>(null);
	async function toggleConsent(key: string, accepted: boolean) {
		consentsSaving = key;
		try {
			await fetch('/api/v1/auth/consents', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: [{ key, accepted }] })
			});
			await invalidateAll();
		} finally {
			consentsSaving = null;
		}
	}
</script>

<svelte:head>
	<title>Asmeninė informacija — Baltijos Žvynas</title>
</svelte:head>

<h1 class="text-2xl font-bold text-foreground">Asmeninė informacija</h1>
<p class="mt-1 text-sm text-muted-foreground-1">
	Atnaujinkite savo duomenis — jie naudojami užsakymams ir sąskaitoms.
</p>

<div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
	<!-- Profilis -->
	<div class="rounded-xl border border-card-line bg-card p-5">
		<h2 class="font-semibold text-foreground">Profilis</h2>
		<form class="mt-4 space-y-4" onsubmit={(e) => { e.preventDefault(); save(); }}>
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="pf-first" class="mb-1 block text-xs font-medium text-muted-foreground-1"
						>Vardas</label
					>
					<input
						id="pf-first"
						type="text"
						bind:value={firstName}
						class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
				<div>
					<label for="pf-last" class="mb-1 block text-xs font-medium text-muted-foreground-1"
						>Pavardė</label
					>
					<input
						id="pf-last"
						type="text"
						bind:value={lastName}
						class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
					/>
				</div>
			</div>
			<div>
				<label for="pf-phone" class="mb-1 block text-xs font-medium text-muted-foreground-1"
					>Telefonas</label
				>
				<input
					id="pf-phone"
					type="tel"
					bind:value={phone}
					placeholder="+370 600 00000"
					class="w-full rounded-lg border border-layer-line bg-layer px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-hidden"
				/>
			</div>
			<div>
				<label for="pf-email" class="mb-1 block text-xs font-medium text-muted-foreground-1"
					>El. paštas</label
				>
				<input
					id="pf-email"
					type="email"
					value={me.email}
					disabled
					class="w-full cursor-not-allowed rounded-lg border border-layer-line bg-muted px-3 py-2.5 text-sm text-muted-foreground-1"
				/>
				<p class="mt-1 flex items-center gap-x-1.5 text-xs text-muted-foreground-1">
					Prisijungimo tapatybė — el. pašto keitimas dar nepalaikomas
					<MissingFeature compact feature="El. pašto keitimas" />
				</p>
			</div>
			{#if error}
				<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
			{/if}
			<div class="flex items-center gap-x-3">
				<button
					type="submit"
					disabled={saving}
					class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
				>
					<Save class="size-4" /> {saving ? 'Saugoma…' : 'Išsaugoti'}
				</button>
				{#if saved}
					<span class="inline-flex items-center gap-x-1 text-sm text-green-600 dark:text-green-400">
						<Check class="size-4" /> Išsaugota
					</span>
				{/if}
			</div>
		</form>
	</div>

	<!-- Sutikimai -->
	<div class="rounded-xl border border-card-line bg-card p-5">
		<h2 class="font-semibold text-foreground">Sutikimai ir komunikacija</h2>
		<p class="mt-1 text-xs text-muted-foreground-1">
			Rinkodaros sutikimus galite bet kada atšaukti.
		</p>
		<ul class="mt-4 space-y-3">
			{#each me.consents ?? [] as c (c.key)}
				<li
					class="flex items-start justify-between gap-x-3 rounded-lg border border-layer-line p-3"
				>
					<div class="min-w-0">
						<p class="text-sm font-medium text-foreground">
							{c.name}
							{#if c.required}
								<span class="text-xs font-normal text-muted-foreground-1">(privalomas)</span>
							{/if}
						</p>
						<p class="mt-0.5 text-xs text-muted-foreground-1">
							{#if c.accepted}
								Priimta{c.accepted_at ? ` ${new Date(c.accepted_at).toLocaleDateString('lt-LT')}` : ''}
							{:else}
								Nepriimta{c.revoked_at
									? ` · atšaukta ${new Date(c.revoked_at).toLocaleDateString('lt-LT')}`
									: ''}
							{/if}
						</p>
					</div>
					{#if c.required}
						<span class="text-xs text-muted-foreground-1">negalima atšaukti</span>
					{:else}
						<button
							type="button"
							disabled={consentsSaving === c.key}
							onclick={() => toggleConsent(c.key, !c.accepted)}
							class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors {c.accepted
								? 'bg-primary'
								: 'bg-layer-line'} disabled:opacity-50"
							role="switch"
							aria-checked={c.accepted}
							aria-label={c.name}
						>
							<span
								class="inline-block size-4 transform rounded-full bg-white transition-transform {c.accepted
									? 'translate-x-6'
									: 'translate-x-1'}"
							></span>
						</button>
					{/if}
				</li>
			{/each}
		</ul>
		<a
			href="/paskyra/naujienlaiskis"
			class="mt-4 inline-block text-sm font-medium text-primary hover:underline"
			>Naujienlaiškio nustatymai →</a
		>
	</div>
</div>
