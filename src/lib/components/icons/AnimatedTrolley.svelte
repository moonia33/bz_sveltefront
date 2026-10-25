<script lang="ts">
	let { class: className = 'size-6' }: { class?: string } = $props();
</script>

<!-- Preline animated icon: hs-icon-trolley (CSS keyframes, no JS) -->
<svg
	class="hs-icon-animated hs-icon-trolley {className}"
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	role="img"
	aria-label="Pristatymas"
>
	<style>
		@keyframes hs-icon-trolley-drive {
			from { transform: translateX(-23px); }
			to { transform: translateX(23px); }
		}
		@keyframes hs-icon-trolley-front {
			0%, 30.5% { transform: rotate(0deg); animation-timing-function: linear; }
			32% { transform: rotate(.8deg); animation-timing-function: linear; }
			33% { transform: rotate(2.3deg); animation-timing-function: linear; }
			34% { transform: rotate(5.2deg); animation-timing-function: linear; }
			35% { transform: rotate(5.9deg); animation-timing-function: linear; }
			36% { transform: rotate(6.2deg); animation-timing-function: linear; }
			37% { transform: rotate(6.3deg); animation-timing-function: linear; }
			38% { transform: rotate(6.2deg); animation-timing-function: linear; }
			39% { transform: rotate(5.8deg); animation-timing-function: linear; }
			40% { transform: rotate(4.8deg); animation-timing-function: linear; }
			41% { transform: rotate(2.2deg); animation-timing-function: linear; }
			42% { transform: rotate(.8deg); animation-timing-function: linear; }
			43.5%, 100% { transform: rotate(0deg); }
		}
		@keyframes hs-icon-trolley-rear {
			0%, 50% { transform: rotate(0deg); animation-timing-function: linear; }
			51.5% { transform: rotate(-.8deg); animation-timing-function: linear; }
			52.5% { transform: rotate(-2.2deg); animation-timing-function: linear; }
			53.5% { transform: rotate(-4.9deg); animation-timing-function: linear; }
			54.5% { transform: rotate(-5.9deg); animation-timing-function: linear; }
			55.5% { transform: rotate(-6.2deg); animation-timing-function: linear; }
			56.5% { transform: rotate(-6.3deg); animation-timing-function: linear; }
			57.5% { transform: rotate(-6.2deg); animation-timing-function: linear; }
			58.5% { transform: rotate(-5.9deg); animation-timing-function: linear; }
			59.5% { transform: rotate(-5.1deg); animation-timing-function: linear; }
			60.5% { transform: rotate(-2.3deg); animation-timing-function: linear; }
			61.5% { transform: rotate(-.8deg); animation-timing-function: linear; }
			63%, 100% { transform: rotate(0deg); }
		}
		@keyframes hs-icon-trolley-box-big {
			0%, 41.5% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			47% { transform: translateY(-.9px) rotate(-3deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			51.5% { transform: translateY(0) rotate(-1.1deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			54% { transform: translateY(0) rotate(.4deg); animation-timing-function: ease-in-out; }
			57% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			66.5% { transform: translateY(-.45px) rotate(-1.6deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			70% { transform: translateY(0) rotate(-.6deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			72.5% { transform: translateY(0) rotate(.2deg); animation-timing-function: ease-in-out; }
			75%, 100% { transform: translateY(0) rotate(0deg); }
		}
		@keyframes hs-icon-trolley-box-mid {
			0%, 41% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			46.5% { transform: translateY(-1.5px) rotate(4deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			52% { transform: translateY(0) rotate(1.4deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			54.5% { transform: translateY(0) rotate(-.5deg); animation-timing-function: ease-in-out; }
			57.5% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			66% { transform: translateY(-.75px) rotate(2deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			70.5% { transform: translateY(0) rotate(.7deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			73% { transform: translateY(0) rotate(-.25deg); animation-timing-function: ease-in-out; }
			75.5%, 100% { transform: translateY(0) rotate(0deg); }
		}
		@keyframes hs-icon-trolley-box-top {
			0%, 40.5% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			46% { transform: translateY(-2.8px) rotate(8deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			53.5% { transform: translateY(0) rotate(2.6deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			56% { transform: translateY(0) rotate(-.9deg); animation-timing-function: ease-in-out; }
			57% { transform: translateY(0) rotate(0deg); animation-timing-function: cubic-bezier(.3, .8, .5, 1); }
			65.5% { transform: translateY(-1.4px) rotate(4deg); animation-timing-function: cubic-bezier(.5, 0, .7, .6); }
			71.5% { transform: translateY(0) rotate(1.2deg); animation-timing-function: cubic-bezier(.3, 0, .3, 1); }
			74% { transform: translateY(0) rotate(-.4deg); animation-timing-function: ease-in-out; }
			76.5%, 100% { transform: translateY(0) rotate(0deg); }
		}
		.hs-icon-trolley-drive,
		.hs-icon-trolley-front,
		.hs-icon-trolley-rear,
		.hs-icon-trolley-box-big,
		.hs-icon-trolley-box-mid,
		.hs-icon-trolley-box-top { transform-box: view-box; }
		.hs-icon-trolley-drive { animation: hs-icon-trolley-drive 2.6s infinite linear; }
		.hs-icon-trolley-front { transform-origin: 9px 22px; animation: hs-icon-trolley-front 2.6s infinite; }
		.hs-icon-trolley-rear { transform-origin: 18px 22px; animation: hs-icon-trolley-rear 2.6s infinite; }
		.hs-icon-trolley-box-big { transform-origin: 10.1px 18px; animation: hs-icon-trolley-box-big 2.6s infinite; }
		.hs-icon-trolley-box-mid { transform-origin: 18.9px 18px; animation: hs-icon-trolley-box-mid 2.6s infinite; }
		.hs-icon-trolley-box-top { transform-origin: 18.9px 13.5px; animation: hs-icon-trolley-box-top 2.6s infinite; }
		@media (prefers-reduced-motion: reduce) {
			.hs-icon-trolley-drive,
			.hs-icon-trolley-front,
			.hs-icon-trolley-rear,
			.hs-icon-trolley-box-big,
			.hs-icon-trolley-box-mid,
			.hs-icon-trolley-box-top { animation: none; }
		}
	</style>

	<path d="M-2 22h11a3 1.05 0 0 0 6 0h13" />

	<g class="hs-icon-trolley-drive">
		<g class="hs-icon-trolley-front">
			<g class="hs-icon-trolley-rear">
				<path d="M22 18H6a2 2 0 0 1-2-2V7a2 2 0 0 0-2-2" />
				<circle cx="18" cy="20" r="2" />
				<circle cx="9" cy="20" r="2" />
				<g stroke-width="1.275">
					<rect class="hs-icon-trolley-box-big" x="7.4" y="11" width="5.4" height="7" rx="1" />
					<rect class="hs-icon-trolley-box-mid" x="16.2" y="13.5" width="5.4" height="4.5" rx="1" />
					<rect class="hs-icon-trolley-box-top" x="16.8" y="9.3" width="4.2" height="4.2" rx="1" />
				</g>
			</g>
		</g>
	</g>
</svg>
