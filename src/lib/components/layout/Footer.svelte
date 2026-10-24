<script lang="ts">
	import type { CategoryOut } from '#lib/api/types';
	import { Check } from '@lucide/svelte';

	let { categories = [] }: { categories?: CategoryOut[] } = $props();

	const topCategories = $derived(categories.filter((c) => !c.parent_id).slice(0, 6));
	const year = new Date().getFullYear();

	const linkClass =
		'text-sm text-muted-foreground-1 underline-offset-4 hover:underline hover:text-foreground focus:outline-hidden focus:underline focus:text-foreground';

	let nlEmail = $state('');
	let nlState = $state<'idle' | 'busy' | 'ok' | 'err'>('idle');
	let nlMsg = $state('');

	async function subscribe() {
		const email = nlEmail.trim();
		if (!email) return;
		nlState = 'busy';
		nlMsg = '';
		try {
			const res = await fetch('/api/v1/newsletter/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, source: 'footer' })
			});
			const b = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(b?.detail || 'Klaida');
			nlState = 'ok';
			nlMsg = 'Prenumerata aktyvuota.';
			nlEmail = '';
		} catch (e) {
			nlState = 'err';
			nlMsg = e instanceof Error ? e.message : 'Nepavyko užregistruoti';
		}
	}
</script>

<footer class="mt-auto bg-footer border-t border-footer-line">
	<div class="w-full max-w-340 mx-auto pt-10 lg:pt-20 px-4 sm:px-6 lg:px-8">
		<div class="mb-10 flex flex-col gap-3">
			<div class="max-w-md">
				<div class="mb-2 flex items-center gap-x-2">
					<label for="footer-newsletter" class="font-medium text-foreground"
						>Prenumeruokite naujienas</label
					>
				</div>
				<form
					class="flex items-center gap-2"
					onsubmit={(e) => {
						e.preventDefault();
						subscribe();
					}}
				>
					<input
						id="footer-newsletter"
						type="email"
						required
						bind:value={nlEmail}
						placeholder="El. pašto adresas"
						class="py-3 px-4 block w-full bg-transparent border border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-line-3"
					/>
					<button
						type="submit"
						disabled={nlState === 'busy'}
						class="py-3 px-4 whitespace-nowrap inline-flex justify-center items-center gap-x-2 sm:text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus disabled:opacity-50"
					>
						{#if nlState === 'ok'}<Check class="size-4" />{/if}
						{nlState === 'busy' ? 'Siunčiama…' : 'Prenumeruoti'}
					</button>
				</form>
				{#if nlMsg}
					<p class="mt-2 text-xs {nlState === 'err' ? 'text-red-400' : 'text-muted-foreground-1'}">
						{nlMsg}
					</p>
				{/if}
			</div>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-14">
			<div>
				<p class="mb-3 font-medium text-sm text-foreground">Pagalba</p>
				<ul class="grid space-y-2">
					<li><a class={linkClass} href="/pagalba">Pagalbos centras</a></li>
					<li><a class={linkClass} href="/grazinimas">Keitimas ir grąžinimas</a></li>
					<li><a class={linkClass} href="/parduotuves">Parduotuvės</a></li>
					<li><a class={linkClass} href="/info/duk">DUK</a></li>
				</ul>
			</div>
			<div>
				<p class="mb-3 font-medium text-sm text-foreground">Informacija</p>
				<ul class="grid space-y-2">
					<li><a class={linkClass} href="/info/apie-mus">Apie mus</a></li>
					<li><a class={linkClass} href="/info/taisykles">Taisyklės</a></li>
					<li><a class={linkClass} href="/info/privatumas">Privatumas</a></li>
				</ul>
			</div>
			<div>
				<p class="mb-3 font-medium text-sm text-foreground">Katalogas</p>
				<ul class="grid space-y-2">
					{#each topCategories as c (c.id)}
						<li><a class={linkClass} href="/k/{c.slug}">{c.name}</a></li>
					{/each}
					<li><a class={linkClass} href="/katalogas">Visos prekės</a></li>
				</ul>
			</div>
			<div>
				<p class="mb-3 font-medium text-sm text-foreground">Kontaktai</p>
				<ul class="grid space-y-2">
					<li><span class="text-sm text-muted-foreground-1">+370 600 00000</span></li>
					<li><span class="text-sm text-muted-foreground-1">info@baltijoszvynas.lt</span></li>
					<li class="pt-1">
						<a class={linkClass} href="/parduotuves">Parduotuvių kontaktai →</a>
					</li>
				</ul>
			</div>
		</div>

		<div
			class="py-6 border-t border-footer-line flex flex-wrap items-center justify-between gap-3"
		>
			<p class="text-xs text-muted-foreground-1">© {year} Baltijos Žvynas</p>
			<div class="flex items-center gap-x-4">
				<a class="text-xs {linkClass}" href="/info/taisykles">Taisyklės</a>
				<a class="text-xs {linkClass}" href="/info/privatumas">Privatumas</a>
			</div>
		</div>
	</div>
</footer>
