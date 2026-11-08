<script lang="ts">
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import BackToTop from '#lib/components/ui/BackToTop.svelte';
	import NavProgress from '#lib/components/ui/NavProgress.svelte';
	import Toasts from '#lib/components/ui/Toasts.svelte';
	import CookieBanner from '#lib/components/consent/CookieBanner.svelte';
	import { consentHeadScript, trackingConfig } from '#lib/consent';
	import LegalReconsent from '#lib/components/account/LegalReconsent.svelte';
	import './layout.css';

	let { data, children } = $props();

	const tracking = $derived(trackingConfig(data.shopConfig));
</script>

<svelte:head>
	{@html consentHeadScript(tracking)}
</svelte:head>

<div class="flex min-h-screen flex-col pb-14 md:pb-0">
	<Header
		categories={data.categories}
		cart={data.cart}
		me={data.me}
		favoriteCount={data.favorite_count}
		navigation={data.navigation}
		shopConfig={data.shopConfig}
	/>
	<main id="content" class="grow">
		{@render children()}
	</main>
	<Footer categories={data.categories} navigation={data.navigation} />
	<BackToTop />
	<NavProgress />
	<Toasts />
	<CookieBanner
		version={tracking.version}
		initial={data.cookieConsent}
		privacyUrl={data.shopConfig?.privacy_url || '/info/privatumas'}
	/>
	{#if data.me?.legal_pending?.length}
		<LegalReconsent pending={data.me.legal_pending} account={data.me.email} />
	{/if}
</div>
