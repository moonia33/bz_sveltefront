<script lang="ts">
	import type { CategoryOut, NavItemOut, NavigationOut } from '#lib/api/types';
	import { Check } from '@lucide/svelte';
	import { m } from '#lib/paraglide/messages';
	import { lh } from '#lib/i18n/instance';

	let {
		categories = [],
		navigation = null
	}: {
		categories?: CategoryOut[];
		navigation?: NavigationOut | null;
	} = $props();

	const topCategories = $derived(categories.filter((c) => !c.parent_id).slice(0, 6));
	const year = new Date().getFullYear();

	const linkClass =
		'text-sm text-muted-foreground-1 underline-offset-4 hover:underline hover:text-foreground focus:outline-hidden focus:underline focus:text-foreground';

	// Fallback'as — identiškas ankstesniam hardkodintam footer'iui,
	// naudojamas tik kai /cms/navigation nepasiekiamas.
	const FALLBACK_COLS: NavItemOut[] = [
		{
			id: -1, kind: 'link', label: m.nav_help(), url: '', icon: '',
			badge: '', highlight: false, new_tab: false, show_in: 'all',
			children: [
				{ id: -11, kind: 'link', label: m.footer_help_center(), url: '/pagalba', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -12, kind: 'link', label: m.footer_returns(), url: '/grazinimas', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -13, kind: 'link', label: m.nav_stores(), url: '/parduotuves', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -14, kind: 'link', label: m.footer_faq(), url: '/info/duk', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] }
			]
		},
		{
			id: -2, kind: 'link', label: m.footer_info(), url: '', icon: '',
			badge: '', highlight: false, new_tab: false, show_in: 'all',
			children: [
				{ id: -21, kind: 'link', label: m.footer_about(), url: '/info/apie-mus', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -22, kind: 'link', label: m.footer_terms(), url: '/info/taisykles', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -23, kind: 'link', label: m.footer_privacy(), url: '/info/privatumas', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] }
			]
		},
		{
			id: -3, kind: 'link', label: m.nav_catalog(), url: '', icon: '',
			badge: '', highlight: false, new_tab: false, show_in: 'all',
			children: []
		},
		{
			id: -4, kind: 'link', label: m.footer_contacts(), url: '', icon: '',
			badge: '', highlight: false, new_tab: false, show_in: 'all',
			children: [
				{ id: -41, kind: 'link', label: '+370 600 00000', url: 'tel:+37060000000', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -42, kind: 'link', label: 'info@baltijoszvynas.lt', url: 'mailto:info@baltijoszvynas.lt', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
				{ id: -43, kind: 'link', label: m.footer_store_contacts(), url: '/parduotuves', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] }
			]
		}
	];
	const FALLBACK_BOTTOM: NavItemOut[] = [
		{ id: -91, kind: 'link', label: m.footer_terms(), url: '/info/taisykles', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] },
		{ id: -92, kind: 'link', label: m.footer_privacy(), url: '/info/privatumas', icon: '', badge: '', highlight: false, new_tab: false, show_in: 'all', children: [] }
	];

	// Stulpeliai: tiesiogiai iš 'footer' meniu (root = antraštė,
	// children = nuorodos); 'Katalogas' stulpelį fallback'e paliekam
	// dinaminį iš kategorijų medžio.
	const columns = $derived(
		navigation?.footers?.length ? navigation.footers : FALLBACK_COLS
	);
	const bottomLinks = $derived(
		navigation?.bottom_links?.length
			? navigation.bottom_links
			: FALLBACK_BOTTOM
	);

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
			nlMsg = m.newsletter_ok();
			nlEmail = '';
		} catch (e) {
			nlState = 'err';
			nlMsg = e instanceof Error ? e.message : m.newsletter_fail();
		}
	}
</script>

<footer class="mt-auto bg-footer border-t border-footer-line">
	<div class="w-full max-w-340 mx-auto pt-10 lg:pt-20 px-4 sm:px-6 lg:px-8">
		<div class="mb-10 flex flex-col gap-3">
			<div class="max-w-md">
				<div class="mb-2 flex items-center gap-x-2">
					<label for="footer-newsletter" class="font-medium text-foreground"
						>{m.footer_newsletter_label()}</label
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
						placeholder={m.footer_email_ph()}
						class="py-3 px-4 block w-full bg-transparent border border-layer-line rounded-lg sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-line-3"
					/>
					<button
						type="submit"
						disabled={nlState === 'busy'}
						class="py-3 px-4 whitespace-nowrap inline-flex justify-center items-center gap-x-2 sm:text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus disabled:opacity-50"
					>
						{#if nlState === 'ok'}<Check class="size-4" />{/if}
						{nlState === 'busy' ? m.ui_sending() : m.ui_subscribe()}
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
			{#each columns as col (col.id)}
				<div>
					{#if col.url}
						<a class="mb-3 block font-medium text-sm text-foreground hover:text-primary-hover" href={lh(col.url)}>{col.label}</a>
					{:else}
						<p class="mb-3 font-medium text-sm text-foreground">{col.label}</p>
					{/if}
					<ul class="grid space-y-2">
						{#each col.children as link (link.id)}
							<li>
								<a
									class={linkClass}
									href={lh(link.url) || '#'}
									target={link.new_tab ? '_blank' : undefined}
									rel={link.new_tab ? 'noopener noreferrer' : undefined}
								>{link.label}</a>
							</li>
						{/each}
						{#if !navigation?.footers?.length && col.label === 'Katalogas'}
							{#each topCategories as c (c.id)}
								<li><a class={linkClass} href={lh('/k/' + c.slug)}>{c.name}</a></li>
							{/each}
							<li><a class={linkClass} href={lh('/katalogas')}>{m.all_products()}</a></li>
						{/if}
					</ul>
				</div>
			{/each}
		</div>

		<div
			class="py-6 border-t border-footer-line flex flex-wrap items-center justify-between gap-3"
		>
			<p class="text-xs text-muted-foreground-1">© {year} Baltijos Žvynas</p>
			<div class="flex items-center gap-x-4">
				{#each bottomLinks as link (link.id)}
					<a class="text-xs {linkClass}" href={lh(link.url) || '#'}>{link.label}</a>
				{/each}
			</div>
		</div>
	</div>
</footer>
