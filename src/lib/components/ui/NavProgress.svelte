<script lang="ts">
	import { navigating } from '$app/state';
	import { fade } from 'svelte/transition';
</script>

{#if navigating.to}
	<div
		class="fixed inset-x-0 top-0 z-90 h-[3px] overflow-hidden"
		role="progressbar"
		aria-label="Kraunamas puslapis"
		aria-busy="true"
		out:fade={{ duration: 200 }}
	>
		<div class="nav-progress h-full w-2/5 rounded-full"></div>
	</div>
{/if}

<style>
	.nav-progress {
		background: linear-gradient(90deg, #2563eb, #dc2626, #f59e0b, #0ea5e9, #2563eb);
		background-size: 300% 100%;
		animation:
			nav-slide 1.2s ease-in-out infinite,
			nav-hue 2.4s linear infinite;
	}
	@keyframes nav-slide {
		0% {
			transform: translateX(-120%);
		}
		100% {
			transform: translateX(350%);
		}
	}
	@keyframes nav-hue {
		to {
			background-position: 300% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nav-progress {
			width: 100%;
			animation: none;
		}
	}
</style>
