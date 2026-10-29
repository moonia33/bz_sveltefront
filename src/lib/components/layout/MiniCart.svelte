<script lang="ts">
	import { X } from '@lucide/svelte';
	import { formatMoney } from '#lib/money';
	import type { CartOut } from '#lib/api/types';
	import Overlay from '#lib/components/ui/Overlay.svelte';
	import { m } from '#lib/paraglide/messages';
	import { lh } from '#lib/i18n/instance';

	let {
		open = $bindable(false),
		cart = null
	}: {
		open?: boolean;
		cart?: CartOut | null;
	} = $props();

	const count = $derived(cart?.items?.reduce((s, i) => s + i.qty, 0) ?? 0);
</script>

<Overlay bind:open side="end" label={m.nav_cart()}>
	<div class="py-3 px-6 flex justify-between items-center border-b border-overlay-divider">
		<h2 class="font-medium text-foreground">{m.cart_title_count({ count })}</h2>
		<button
			type="button"
			onclick={() => (open = false)}
			class="py-1.5 px-2 inline-flex justify-center items-center gap-x-1 rounded-full bg-layer border border-layer-line text-xs text-foreground hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus"
		>
			<span class="hidden lg:block">Esc</span>
			<span class="block lg:hidden">{m.ui_close()}</span>
			<X class="shrink-0 size-4" />
		</button>
	</div>

	<div class="h-full overflow-y-auto">
		{#if cart?.items?.length}
			<div class="p-6 space-y-7">
				{#each cart.items as item (item.id)}
					<div class="flex gap-x-4">
						{#if item.image}
							<a href="/p/{item.product_slug}" onclick={() => (open = false)} class="shrink-0">
								<picture>
									{#if item.image.avif_url}<source srcset={item.image.avif_url} type="image/avif" />{/if}
									{#if item.image.webp_url}<source srcset={item.image.webp_url} type="image/webp" />{/if}
									<img
										src={item.image.url}
										alt={item.image.alt_text || item.name}
										width="64"
										height="64"
										loading="lazy"
										decoding="async"
										class="size-16 rounded-lg bg-surface object-cover"
									/>
								</picture>
							</a>
						{/if}
						<div class="grow flex flex-col min-w-0">
							<p class="text-sm text-foreground">
								{#if item.product_slug}
									<a href="/p/{item.product_slug}" onclick={() => (open = false)} class="hover:underline">{item.name}</a>
								{:else}
									{item.name}
								{/if}
							</p>
							{#if item.variant_name && item.variant_name !== item.name}
								<p class="mt-0.5 text-xs text-foreground">{item.variant_name}</p>
							{/if}
							{#if item.options?.length}
								<p class="mt-0.5 text-xs text-muted-foreground-1">
									{#each item.options as opt, oi}
										{opt.option_type_name}: {opt.option_value_label}{oi < item.options.length - 1 ? ' · ' : ''}
									{/each}
								</p>
							{/if}
							<p class="mt-1.5 text-xs text-muted-foreground-1">{item.sku}</p>
							<p class="mt-1.5 text-xs text-muted-foreground-1">
								{item.qty} × {formatMoney(item.unit_price)}
							</p>
							<span class="mt-1.5 text-sm text-foreground">{formatMoney(item.line_total)}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-6 text-center">
				<p class="text-sm text-muted-foreground-1">{m.cart_empty()}</p>
				<a
					href={lh('/katalogas')}
					onclick={() => (open = false)}
					class="mt-3 inline-flex items-center text-sm text-foreground underline underline-offset-4 hover:text-primary-hover"
					>{m.nav_to_catalog()}</a
				>
			</div>
		{/if}
	</div>

	{#if cart?.items?.length}
		<div class="py-4 px-6 border-t border-overlay-divider">
			<div class="flex justify-between items-center text-sm">
				<span class="text-muted-foreground-1">{m.cart_subtotal()}</span>
				<span class="font-medium text-foreground">{formatMoney(cart.items_total)}</span>
			</div>
			<a
				href={lh('/krepselis')}
				onclick={() => (open = false)}
				class="mt-3 w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus"
				>{m.cart_view()}</a
			>
		</div>
	{/if}
</Overlay>
