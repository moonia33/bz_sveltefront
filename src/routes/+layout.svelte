<script lang="ts">
	import Header from '#lib/components/layout/Header.svelte';
	import Footer from '#lib/components/layout/Footer.svelte';
	import './layout.css';

	let { data, children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-gray-50 dark:bg-neutral-950">
	<Header categories={data.categories} cartCount={data.cartCount} me={data.me} />
	<main class="grow">
		{@render children()}
	</main>
	<Footer />
</div>
