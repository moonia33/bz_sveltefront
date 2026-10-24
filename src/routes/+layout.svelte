<script lang="ts">
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import BackToTop from '#lib/components/ui/BackToTop.svelte';
	import NavProgress from '#lib/components/ui/NavProgress.svelte';
	import './layout.css';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col pb-14 md:pb-0">
	<Header
		categories={data.categories}
		cart={data.cart}
		me={data.me}
		favoriteCount={data.favorite_count}
		navigation={data.navigation}
	/>
	<main id="content" class="grow">
		{@render children()}
	</main>
	<Footer categories={data.categories} navigation={data.navigation} />
	<BackToTop />
	<NavProgress />
</div>
