<script lang="ts">
	let { class: className = 'size-6' }: { class?: string } = $props();
</script>

<!-- Preline animated icon: hs-icon-shop (CSS keyframes, no JS) -->
<svg
	class="hs-icon-animated hs-icon-shop {className}"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	role="img"
	aria-label="Atsiėmimas parduotuvėje"
>
	<defs>
		<clipPath id="hs-icon-shop-clip">
			<rect x="0" y="0" width="24" height="11" />
		</clipPath>
	</defs>

	<style>
		@keyframes hs-icon-shop-store {
			0%, 5.5% { transform: translateY(0); animation-timing-function: cubic-bezier(.5, 0, .8, .45); }
			20.5%, 81% { transform: translateY(24px); animation-timing-function: cubic-bezier(.3, .7, .4, 1); }
			95%, 100% { transform: translateY(0); }
		}
		@keyframes hs-icon-shop-basket {
			0%, 12.5% { transform: translateY(-22px); animation-timing-function: cubic-bezier(.5, 0, .75, .5); }
			28.5% { transform: translateY(0); animation-timing-function: cubic-bezier(.3, .6, .4, 1); }
			31% { transform: translateY(-1.2px); animation-timing-function: cubic-bezier(.4, 0, .3, 1); }
			33%, 74.5% { transform: translateY(0); animation-timing-function: cubic-bezier(.45, 0, .8, .5); }
			88%, 100% { transform: translateY(-22px); }
		}
		@keyframes hs-icon-shop-handle-left {
			0%, 32% { transform: rotate(0); animation-timing-function: cubic-bezier(.5, 0, .4, 1); }
			39%, 67% { transform: rotate(-67.6deg); animation-timing-function: cubic-bezier(.5, 0, .4, 1); }
			74.5%, 100% { transform: rotate(0); }
		}
		@keyframes hs-icon-shop-handle-right {
			0%, 32% { transform: rotate(0); animation-timing-function: cubic-bezier(.5, 0, .4, 1); }
			39%, 67% { transform: rotate(67.6deg); animation-timing-function: cubic-bezier(.5, 0, .4, 1); }
			74.5%, 100% { transform: rotate(0); }
		}
		@keyframes hs-icon-shop-item-a {
			0%, 39% { transform: translateY(-22px); animation-timing-function: cubic-bezier(.3, 0, .55, 1); }
			53%, 100% { transform: translateY(0); }
		}
		@keyframes hs-icon-shop-item-b {
			0%, 53% { transform: translateY(-22px); animation-timing-function: cubic-bezier(.3, 0, .55, 1); }
			67%, 100% { transform: translateY(0); }
		}
		.hs-icon-shop-store { animation: hs-icon-shop-store 4.4s infinite; }
		.hs-icon-shop-basket { animation: hs-icon-shop-basket 4.4s infinite; }
		.hs-icon-shop-handle-left,
		.hs-icon-shop-handle-right { transform-box: view-box; }
		.hs-icon-shop-handle-left { transform-origin: 6px 9.5px; animation: hs-icon-shop-handle-left 4.4s infinite; }
		.hs-icon-shop-handle-right { transform-origin: 18px 9.5px; animation: hs-icon-shop-handle-right 4.4s infinite; }
		.hs-icon-shop-item-a { animation: hs-icon-shop-item-a 4.4s infinite; }
		.hs-icon-shop-item-b { animation: hs-icon-shop-item-b 4.4s infinite; }
		@media (prefers-reduced-motion: reduce) {
			.hs-icon-shop-store,
			.hs-icon-shop-basket,
			.hs-icon-shop-handle-left,
			.hs-icon-shop-handle-right,
			.hs-icon-shop-item-a,
			.hs-icon-shop-item-b { animation: none; }
			.hs-icon-shop-basket { opacity: 0; }
		}
	</style>

	<g class="hs-icon-shop-store">
		<path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5" />
		<path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244" />
		<path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05" />
	</g>

	<g class="hs-icon-shop-basket">
		<g clip-path="url(#hs-icon-shop-clip)">
			<g class="hs-icon-shop-item-a">
				<g transform="translate(5.1 10.9) scale(.45)" stroke-width="2.833">
					<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
				</g>
			</g>
			<g class="hs-icon-shop-item-b">
				<g transform="translate(8.1 10.9) scale(.45)" stroke-width="2.833">
					<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
				</g>
			</g>
		</g>
		<path class="hs-icon-shop-handle-left" d="m5 11 4-7" />
		<path class="hs-icon-shop-handle-right" d="m19 11-4-7" />
		<path d="M2 11h20" />
		<path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
		<path d="M4.5 15.5h15" />
		<path d="m9 11 1 9" />
		<path d="m15 11-1 9" />
	</g>
</svg>
