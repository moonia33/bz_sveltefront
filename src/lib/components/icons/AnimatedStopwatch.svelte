<script lang="ts">
	let { class: className = 'size-6' }: { class?: string } = $props();
</script>

<!-- Preline animated icon: hs-icon-stopwatch (CSS keyframes, no JS) -->
<svg
	class="hs-icon-animated hs-icon-stopwatch {className}"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	role="img"
	aria-label="Pristatymo laikas"
>
	<style>
		@keyframes hs-icon-stopwatch-crown {
			0%, 2% { transform: translate(0, 0); animation-timing-function: cubic-bezier(.5, 0, .8, .5); }
			7% { transform: translate(0, 1.2px); animation-timing-function: cubic-bezier(.3, .8, .4, 1); }
			16%, 80% { transform: translate(0, 0); }
			82.2% { transform: translate(1px, 0); }
			84.6% { transform: translate(-.75px, 0); }
			87% { transform: translate(.5px, 0); }
			89.4% { transform: translate(-.28px, 0); }
			91.5% { transform: translate(.12px, 0); }
			93%, 100% { transform: translate(0, 0); }
		}
		@keyframes hs-icon-stopwatch-hand {
			0%, 7% { transform: rotate(0deg); animation-timing-function: cubic-bezier(.25, .15, .75, .85); }
			80%, 100% { transform: rotate(360deg); }
		}
		.hs-icon-stopwatch-crown { animation: hs-icon-stopwatch-crown 2.6s cubic-bezier(.4, 0, .6, 1) infinite; }
		.hs-icon-stopwatch-hand {
			transform-box: view-box;
			transform-origin: 12px 14px;
			animation: hs-icon-stopwatch-hand 2.6s infinite;
		}
		@media (prefers-reduced-motion: reduce) {
			.hs-icon-stopwatch-crown,
			.hs-icon-stopwatch-hand { animation: none; }
		}
	</style>

	<path class="hs-icon-stopwatch-crown" d="M10 2h4" />
	<circle cx="12" cy="14" r="8" />
	<path class="hs-icon-stopwatch-hand" d="m12 14v-4.243" />
</svg>
