<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	let {
		open = $bindable(false),
		side = 'center',
		label,
		panelClass = '',
		children
	}: {
		open?: boolean;
		side?: 'start' | 'end' | 'center';
		label: string;
		panelClass?: string;
		children: Snippet;
	} = $props();

	let panel = $state<HTMLElement | null>(null);
	let prevFocus: Element | null = null;

	function close() {
		open = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') close();
	}

	$effect(() => {
		if (!open) return;
		prevFocus = document.activeElement;
		document.body.style.overflow = 'hidden';
		const restore = prevFocus instanceof HTMLElement ? prevFocus : null;
		queueMicrotask(() => panel?.focus());
		return () => {
			document.body.style.overflow = '';
			restore?.focus?.();
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<button
		type="button"
		class="fixed inset-0 z-70 cursor-default bg-black/50"
		aria-label="Uždaryti"
		tabindex={-1}
		onclick={close}
	></button>
	{#if side === 'center'}
		<div
			class="pointer-events-none fixed inset-0 z-80 overflow-x-hidden overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-label={label}
			tabindex="-1"
			bind:this={panel}
		>
			<div class="m-3 mx-auto flex min-h-[calc(100%-56px)] max-w-lg items-center xl:max-w-3xl">
				<div
					class="pointer-events-auto relative flex max-h-full w-full flex-col rounded-xl border border-overlay-line bg-overlay shadow-xl {panelClass}"
				>
					{@render children()}
				</div>
			</div>
		</div>
	{:else}
		<div
			bind:this={panel}
			role="dialog"
			aria-modal="true"
			aria-label={label}
			tabindex="-1"
			in:fly={{ x: side === 'start' ? -400 : 400, duration: 250 }}
			class="fixed inset-y-0 z-80 flex w-full flex-col bg-overlay shadow-xl transition-transform sm:w-96 {side ===
			'start'
				? 'inset-s-0'
				: 'inset-e-0'} {panelClass}"
		>
			{@render children()}
		</div>
	{/if}
{/if}
