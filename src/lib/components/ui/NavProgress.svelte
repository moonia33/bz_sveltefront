<script lang="ts">
	import { navigating } from '$app/state';
	import { fade } from 'svelte/transition';

	let visible = $state(false);

	// Show only for navigations taking longer than a beat.
	$effect(() => {
		if (!navigating.to) {
			visible = false;
			return;
		}
		const t = setTimeout(() => (visible = true), 150);
		return () => clearTimeout(t);
	});
</script>

{#if visible}
	<div
		class="fixed inset-x-0 top-0 z-90 h-0.5 overflow-hidden"
		role="progressbar"
		aria-label="Kraunamas puslapis"
		transition:fade={{ duration: 150 }}
	>
		<div class="nav-progress h-full w-2/5 rounded-full bg-primary"></div>
	</div>
{/if}
