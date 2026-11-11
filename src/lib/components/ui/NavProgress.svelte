<script lang="ts">
	import { navigating } from '$app/state';

	// Navigacijos indikatorius: "valas" per ekrano viršų, plūdė jo gale.
	// Rodomas iškart po paspaudimo; jei krovimas ilgesnis nei 1 s – plūdė "kimba".
	type Phase = 'idle' | 'start' | 'run' | 'done';

	let phase = $state<Phase>('idle');
	let biting = $state(false);
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	const loading = $derived(!!navigating.to);

	$effect(() => {
		if (!loading) return;
		clearTimeout(hideTimer);
		phase = 'start';
		biting = false;
		let raf2 = 0;
		const raf1 = requestAnimationFrame(() => {
			raf2 = requestAnimationFrame(() => (phase = 'run'));
		});
		const bite = setTimeout(() => (biting = true), 1000);
		return () => {
			cancelAnimationFrame(raf1);
			cancelAnimationFrame(raf2);
			clearTimeout(bite);
			phase = 'done';
			hideTimer = setTimeout(() => {
				phase = 'idle';
				biting = false;
			}, 450);
		};
	});
</script>

{#if phase !== 'idle'}
	<div
		class="nav-cast"
		class:done={phase === 'done'}
		role="progressbar"
		aria-label="Kraunamas puslapis"
		aria-busy={phase !== 'done'}
	>
		<div
			class="nav-line bg-primary"
			class:run={phase === 'run'}
			class:end={phase === 'done'}
		>
			<span class="nav-float" class:biting aria-hidden="true">
				<span class="ripple"></span>
				<span class="ripple r2"></span>
				<svg viewBox="0 0 12 30" width="12" height="30">
					<rect x="5.4" y="0" width="1.2" height="8" rx="0.6" class="fill-red-600" />
					<path d="M1 17 A5 8 0 0 1 11 17 Z" class="fill-red-600" />
					<path d="M1 17 A5 8 0 0 0 11 17 Z" fill="#fff" stroke="#d1d5db" stroke-width="0.8" />
					<rect x="5.5" y="24.5" width="1" height="5" rx="0.5" fill="#9ca3af" />
				</svg>
			</span>
		</div>
	</div>
{/if}

<style>
	.nav-cast {
		position: fixed;
		inset-inline: 0;
		top: 0;
		z-index: 90;
		height: 2px;
		pointer-events: none;
		transition: opacity 250ms ease 150ms;
	}
	.nav-cast.done {
		opacity: 0;
	}
	.nav-line {
		position: relative;
		height: 2px;
		width: 0;
		border-radius: 0 2px 2px 0;
	}
	.nav-line.run {
		width: 88%;
		transition: width 9s cubic-bezier(0.05, 0.75, 0.15, 1);
	}
	.nav-line.end {
		width: 100%;
		transition: width 200ms ease-out;
	}
	.nav-float {
		position: absolute;
		right: -6px;
		top: 0;
		width: 12px;
		height: 30px;
		transform-origin: 50% 0;
		animation: bob 1.6s ease-in-out infinite;
		filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.15));
	}
	.nav-float svg {
		display: block;
	}
	.nav-float.biting {
		animation: bite 1.8s ease-in-out infinite;
	}
	.ripple {
		position: absolute;
		left: 50%;
		top: 22px;
		width: 26px;
		height: 7px;
		margin-left: -13px;
		border: 1px solid var(--primary, currentColor);
		border-radius: 50%;
		opacity: 0;
	}
	.biting .ripple {
		animation: ripple 1.8s ease-out infinite;
	}
	.biting .ripple.r2 {
		animation-delay: 0.3s;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0) rotate(-4deg);
		}
		50% {
			transform: translateY(2px) rotate(4deg);
		}
	}
	@keyframes bite {
		0%,
		55%,
		100% {
			transform: translateY(0) rotate(0);
		}
		62% {
			transform: translateY(7px) rotate(-3deg);
		}
		70% {
			transform: translateY(1px) rotate(3deg);
		}
		78% {
			transform: translateY(5px) rotate(0);
		}
	}
	@keyframes ripple {
		0%,
		55% {
			opacity: 0;
			transform: scale(0.3);
		}
		65% {
			opacity: 0.7;
		}
		100% {
			opacity: 0;
			transform: scale(1.6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.nav-float,
		.nav-float.biting,
		.biting .ripple {
			animation: none;
		}
		.nav-cast,
		.nav-line.run,
		.nav-line.end {
			transition: none;
		}
	}
</style>
