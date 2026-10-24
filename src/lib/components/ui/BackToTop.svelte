<script lang="ts">
	import { ArrowUp } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	let scrollY = $state(0);
	let progress = $state(0);

	const R = 22;
	const CIRC = 2 * Math.PI * R;

	function onScroll() {
		scrollY = window.scrollY;
		const max = document.documentElement.scrollHeight - window.innerHeight;
		progress = max > 0 ? Math.min(1, scrollY / max) : 0;
	}

	onMount(() => {
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	});
</script>

{#if scrollY > 400}
	<button
		type="button"
		onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
		aria-label="Grįžti į viršų"
		transition:fade={{ duration: 150 }}
		class="fixed end-5 bottom-5 z-40 inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-hover focus:outline-hidden focus:bg-primary-focus"
	>
		<svg
			class="pointer-events-none absolute inset-0 -m-px size-[calc(100%+2px)] -rotate-90"
			viewBox="0 0 48 48"
			aria-hidden="true"
		>
			<circle
				cx="24"
				cy="24"
				r={R}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				class="text-primary-foreground/20"
			/>
			<circle
				cx="24"
				cy="24"
				r={R}
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-dasharray={CIRC}
				stroke-dashoffset={CIRC * (1 - progress)}
				class="text-primary-foreground transition-[stroke-dashoffset] duration-100"
			/>
		</svg>
		<ArrowUp class="size-4.5" />
	</button>
{/if}
