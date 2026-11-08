<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { m } from '#lib/paraglide/messages';
	import { lh } from '#lib/i18n/instance';
	import {
		cookieSettingsOpen,
		parseConsent,
		saveConsent,
		trackPageView,
		type ConsentAction,
		type ConsentChoice,
		type ConsentState
	} from '#lib/consent';

	let {
		version,
		initial = null,
		privacyUrl = '/info/privatumas'
	}: { version: number; initial?: string | null; privacyUrl?: string } = $props();

	let consent = $state<ConsentState | null>(parseConsent(initial, version));
	let detailed = $state(false);
	let choice = $state<ConsentChoice>({
		functional: consent?.functional ?? false,
		analytics: consent?.analytics ?? false,
		marketing: consent?.marketing ?? false
	});

	const visible = $derived(consent?.v !== version || $cookieSettingsOpen);

	$effect(() => {
		if ($cookieSettingsOpen) detailed = true;
	});

	let first = true;
	afterNavigate(() => {
		if (first) {
			first = false;
			return;
		}
		trackPageView();
	});

	function save(next: ConsentChoice, action: ConsentAction) {
		choice = next;
		consent = saveConsent(next, action, version, consent);
		detailed = false;
		cookieSettingsOpen.set(false);
	}

	const all = (v: boolean): ConsentChoice => ({ functional: v, analytics: v, marketing: v });

	const rows = $derived([
		{ key: 'functional', label: m.cookie_functional(), desc: m.cookie_functional_desc() },
		{ key: 'analytics', label: m.cookie_analytics(), desc: m.cookie_analytics_desc() },
		{ key: 'marketing', label: m.cookie_marketing(), desc: m.cookie_marketing_desc() }
	] as const);

	const btn =
		'py-2.5 px-4 inline-flex justify-center items-center text-sm font-medium rounded-lg focus:outline-hidden';
</script>

{#if visible}
	<div
		role="dialog"
		aria-modal="false"
		aria-labelledby="cookie-banner-title"
		class="fixed inset-x-0 bottom-0 z-[80] p-3 md:p-4 mb-14 md:mb-0"
	>
		<div
			class="mx-auto max-w-3xl max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-xl border border-card-line bg-card p-4 md:p-5 shadow-xl text-sm"
		>
			<h2 id="cookie-banner-title" class="font-medium text-base text-foreground">{m.cookie_title()}</h2>
			<p class="mt-1 text-muted-foreground-1">
				{m.cookie_text()}
				<a class="underline hover:text-foreground" href={lh(privacyUrl)}>{m.cookie_policy()}</a>
			</p>

			{#if detailed}
				<ul class="mt-4 divide-y divide-card-line border-y border-card-line">
					<li class="flex items-start justify-between gap-4 py-3">
						<div>
							<p class="font-medium text-foreground">{m.cookie_necessary()}</p>
							<p class="text-muted-foreground-1">{m.cookie_necessary_desc()}</p>
						</div>
						<input type="checkbox" checked disabled class="mt-1 size-4 shrink-0" aria-label={m.cookie_necessary()} />
					</li>
					{#each rows as row (row.key)}
						<li class="flex items-start justify-between gap-4 py-3">
							<label for="cookie-{row.key}" class="cursor-pointer">
								<span class="block font-medium text-foreground">{row.label}</span>
								<span class="block text-muted-foreground-1">{row.desc}</span>
							</label>
							<input
								id="cookie-{row.key}"
								type="checkbox"
								bind:checked={choice[row.key]}
								class="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
							/>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="mt-4 flex flex-wrap gap-2">
				<button type="button" class="{btn} bg-primary text-primary-foreground hover:bg-primary-hover" onclick={() => save(all(true), 'accept_all')}>
					{m.cookie_accept_all()}
				</button>
				<button type="button" class="{btn} bg-primary text-primary-foreground hover:bg-primary-hover" onclick={() => save(all(false), 'reject_all')}>
					{m.cookie_reject_all()}
				</button>
				{#if detailed}
					<button type="button" class="{btn} border border-layer-line bg-layer text-layer-foreground hover:bg-layer-hover" onclick={() => save({ ...choice }, 'custom')}>
						{m.cookie_save()}
					</button>
				{:else}
					<button type="button" class="{btn} border border-layer-line bg-layer text-layer-foreground hover:bg-layer-hover" onclick={() => (detailed = true)}>
						{m.cookie_settings()}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
