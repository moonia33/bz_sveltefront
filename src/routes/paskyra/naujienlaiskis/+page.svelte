<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Mail, MailCheck, MailX } from '@lucide/svelte';

	let { data } = $props();
	const status = $derived(data.status);
	const me = $derived(data.me);

	let subscribed = $state<boolean>(data.status?.subscribed ?? false);
	let busy = $state(false);
	let msg = $state('');

	async function toggle(next: boolean) {
		busy = true;
		msg = '';
		try {
			const res = await fetch('/api/v1/newsletter/preference', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subscribed: next })
			});
			const b = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(b?.detail || 'Nepavyko išsaugoti');
			subscribed = Boolean(b.subscribed);
			msg = next ? 'Prenumerata įjungta.' : 'Prenumerata išjungta.';
			await invalidateAll();
		} catch (e) {
			msg = e instanceof Error ? e.message : 'Nepavyko išsaugoti';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Naujienlaiškis — Baltijos Žvynas</title>
</svelte:head>

<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
	<Mail class="size-6" /> Naujienlaiškis
</h1>
<p class="mt-1 text-sm text-muted-foreground-1">
	Rinkodaros laiškai (akcijos, naujienos). Užsakymų ir sąskaitų laiškai siunčiami
	nepriklausomai nuo šio nustatymo.
</p>

<div class="mt-6 max-w-xl rounded-xl border border-card-line bg-card p-5">
	<div class="flex items-start justify-between gap-4">
		<div class="flex items-start gap-x-3">
			<span
				class="flex size-10 items-center justify-center rounded-lg {subscribed
					? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'
					: 'bg-layer-hover text-muted-foreground-1'}"
			>
				{#if subscribed}<MailCheck class="size-5" />{:else}<MailX class="size-5" />{/if}
			</span>
			<div>
				<p class="font-semibold text-foreground">
					{subscribed ? 'Prenumerata aktyvi' : 'Prenumerata išjungta'}
				</p>
				<p class="mt-0.5 text-sm text-muted-foreground-1">
					{status?.email || me.email}
				</p>
			</div>
		</div>
		<button
			type="button"
			disabled={busy}
			onclick={() => toggle(!subscribed)}
			class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors {subscribed
				? 'bg-primary'
				: 'bg-layer-line'} disabled:opacity-50"
			role="switch"
			aria-checked={subscribed}
			aria-label="Naujienlaiškio prenumerata"
		>
			<span
				class="inline-block size-4 transform rounded-full bg-white transition-transform {subscribed
					? 'translate-x-6'
					: 'translate-x-1'}"
			></span>
		</button>
	</div>
	{#if msg}
		<p class="mt-3 text-sm text-muted-foreground-1">{msg}</p>
	{/if}
</div>

<div class="mt-4 max-w-xl rounded-xl border border-layer-line bg-layer p-4 text-xs text-muted-foreground-1">
	Prenumerata saugoma su laiko žyme ir atšaukimo įrašu — galite atsisakyti bet
	kada šiame puslapyje arba laiško apačioje esančia atsisakymo nuoroda.
</div>
