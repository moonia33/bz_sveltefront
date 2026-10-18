<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import { Minus, Plus, ShoppingBag, Trash2 } from '@lucide/svelte';

	let { data, form } = $props();
	const cart = $derived(data.cart);
	const items = $derived(cart?.items ?? []);

	const refresh = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') await invalidateAll();
		};
	};
</script>

<svelte:head>
	<title>Krepšelis — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Krepšelis</h1>

	{#if cart && items.length}
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
			<ul class="space-y-4 lg:col-span-2">
				{#each items as item (item.id)}
					<li
						class="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
					>
						<div class="min-w-0 grow">
							<p class="font-medium text-gray-900 dark:text-white">{item.name}</p>
							<p class="mt-0.5 text-xs text-gray-400">Kodas: {item.sku}</p>
							{#if item.discount_percent}
								<span
									class="mt-1 inline-block rounded-full bg-zvynas-50 px-2 py-0.5 text-xs font-semibold text-zvynas-700"
									>−{item.discount_percent}%</span
								>
							{/if}
							<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
								{formatMoney(item.unit_price)} / vnt.
							</p>
						</div>
						<div class="flex flex-col items-end justify-between gap-2">
							<form method="POST" action="?/update" use:enhance={refresh}>
								<input type="hidden" name="item_id" value={item.id} />
								<div
									class="flex items-center rounded-lg border border-gray-200 dark:border-neutral-700"
								>
									<button
										type="submit"
										name="qty"
										value={item.qty - 1}
										disabled={item.qty <= 1}
										class="p-2 text-gray-500 disabled:opacity-40"
										aria-label="Sumažinti"><Minus class="size-4" /></button
									>
									<span class="w-9 text-center text-sm font-medium">{item.qty}</span>
									<button
										type="submit"
										name="qty"
										value={item.qty + 1}
										class="p-2 text-gray-500"
										aria-label="Padidinti"><Plus class="size-4" /></button
									>
								</div>
							</form>
							<div class="flex items-center gap-3">
								<span class="font-semibold text-gray-900 dark:text-white"
									>{formatMoney(item.line_total)}</span
								>
								<form method="POST" action="?/remove" use:enhance={refresh}>
									<input type="hidden" name="item_id" value={item.id} />
									<button
										type="submit"
										class="text-gray-400 hover:text-zvynas-600"
										aria-label="Pašalinti"><Trash2 class="size-4" /></button
									>
								</form>
							</div>
						</div>
					</li>
				{/each}
			</ul>

			<aside
				class="h-fit rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900"
			>
				<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Suvestinė</h2>
				<dl class="mt-4 space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-gray-500 dark:text-neutral-400">Prekės</dt>
						<dd class="font-medium text-gray-900 dark:text-white">
							{formatMoney(cart.items_total)}
						</dd>
					</div>
					<div class="flex justify-between border-t border-gray-200 pt-2 dark:border-neutral-700">
						<dt class="font-semibold text-gray-900 dark:text-white">Iš viso</dt>
						<dd class="text-lg font-bold text-gray-900 dark:text-white">
							{formatMoney(cart.items_total)}
						</dd>
					</div>
				</dl>
				{#if cart.delivery_window}
					<p class="mt-3 text-xs text-gray-500 dark:text-neutral-400">
						Numatomas pristatymas: {cart.delivery_window.min_date} – {cart.delivery_window
							.max_date}
					</p>
				{/if}
				<a
					href="/checkout"
					class="mt-4 block rounded-full bg-zvynas-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-zvynas-700"
					>Apmokėti</a
				>
			</aside>
		</div>
	{:else}
		<div
			class="rounded-xl border border-dashed border-gray-300 py-20 text-center dark:border-neutral-700"
		>
			<ShoppingBag class="mx-auto size-12 text-gray-300 dark:text-neutral-600" />
			<p class="mt-4 text-gray-500 dark:text-neutral-400">Krepšelis tuščias.</p>
			<a
				href="/katalogas"
				class="mt-4 inline-block rounded-full bg-zvynas-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zvynas-700"
				>Tęsti apsipirkimą</a
			>
		</div>
	{/if}

	{#if form?.error}
		<p class="mt-4 text-sm text-zvynas-600">{form.error}</p>
	{/if}
</div>
