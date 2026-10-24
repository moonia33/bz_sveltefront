<script lang="ts">
	import AccountNav from '#lib/components/account/AccountNav.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
		<aside class="lg:sticky lg:top-24 lg:self-start">
			<AccountNav />
		</aside>
		<div class="min-w-0">
			{@render children()}
		</div>
	</div>
</div>
