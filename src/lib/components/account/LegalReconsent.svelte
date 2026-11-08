<script lang="ts">
	import { browser } from '$app/env';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Overlay from '#lib/components/ui/Overlay.svelte';
	import { pushToast } from '#lib/toast';
	import type { LegalPendingOut } from '#lib/api/types';

	let { pending = [] }: { pending?: LegalPendingOut[] } = $props();

	const SNOOZE_KEY = 'legal_reconsent_snooze';
	const key = $derived(pending.map((p) => `${p.kind}:${p.version}`).join(','));

	let snoozed = $state<string | null>(browser ? sessionStorage.getItem(SNOOZE_KEY) : null);
	let busy = $state(false);
	let error = $state<string | null>(null);
	let open = $state(false);

	// Dokumento puslapyje ir checkout'e langas netrukdo skaityti / pirkti.
	const hiddenHere = $derived(
		page.url.pathname.startsWith('/info/') || page.url.pathname.startsWith('/checkout')
	);

	$effect(() => {
		open = browser && pending.length > 0 && snoozed !== key && !hiddenHere;
	});

	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString('lt-LT', { year: 'numeric', month: '2-digit', day: '2-digit' });

	function later() {
		sessionStorage.setItem(SNOOZE_KEY, key);
		snoozed = key;
	}

	async function accept() {
		busy = true;
		error = null;
		try {
			const res = await fetch('/api/v1/legal/accept', {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ items: pending.map((p) => ({ kind: p.kind, version: p.version })) })
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(d?.detail ?? `Klaida (${res.status})`);
			pushToast('Ačiū, sutikimas išsaugotas.');
			await invalidateAll();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Nepavyko išsaugoti.';
			await invalidateAll();
		} finally {
			busy = false;
		}
	}
</script>

<Overlay
	bind:open={() => open, (v) => {
		if (!v) later();
	}}
	label="Atnaujinti dokumentai"
>
	<div class="p-5 sm:p-6">
		<h2 class="text-lg font-medium text-foreground">Atnaujinome dokumentus</h2>
		<p class="mt-2 text-sm text-muted-foreground-1">
			Peržiūrėkite pasikeitimus ir patvirtinkite, kad su jais susipažinote.
		</p>
		<ul class="mt-4 space-y-3">
			{#each pending as p (p.kind)}
				<li class="rounded-lg border border-card-line p-3 text-sm">
					<a href={p.url} target="_blank" rel="noopener" class="font-medium text-primary underline"
						>{p.title}</a
					>
					<span class="text-muted-foreground-1"> — galioja nuo {fmtDate(p.effective_from)}</span>
					{#if p.change_summary}
						<p class="mt-1 whitespace-pre-line text-muted-foreground-1">{p.change_summary}</p>
					{/if}
				</li>
			{/each}
		</ul>
		{#if error}
			<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
				{error}
			</p>
		{/if}
		<div class="mt-5 flex flex-wrap justify-end gap-2">
			<button
				type="button"
				onclick={later}
				class="rounded-lg border border-layer-line px-4 py-2 text-sm text-foreground hover:bg-layer-hover"
				>Vėliau</button
			>
			<button
				type="button"
				onclick={accept}
				disabled={busy}
				class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
				>Sutinku</button
			>
		</div>
	</div>
</Overlay>
