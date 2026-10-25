<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import { Heart, RotateCcw, ShieldCheck, ShoppingBag, Trash2, Truck } from '@lucide/svelte';

	let { data, form } = $props();
	const cart = $derived(data.cart);
	const items = $derived(cart?.items ?? []);

	// Eilutė, kuriai klausiama „perkelti į mėgstamas?" prieš šalinant.
	let confirmRemoveId = $state<number | null>(null);
	let couponCode = $state('');

	const refresh = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') await invalidateAll();
		};
	};

	const applyCoupon = () => {
		const c = couponCode.trim();
		if (c) goto(`/checkout?coupon=${encodeURIComponent(c)}`);
		else goto('/checkout');
	};
</script>

<svelte:head>
	<title>Krepšelis — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Krepšelis</h1>

	{#if cart && items.length}
		<div class="grid grid-cols-1 gap-10 lg:grid-cols-3">
			<!-- Prekių sąrašas -->
			<div class="lg:col-span-2">
				<ul class="divide-y divide-gray-200 dark:divide-neutral-700">
					{#each items as item (item.id)}
						<li class="flex gap-x-5 py-6 first:pt-0">
							<!-- Thumb -->
							<div class="relative shrink-0">
								<a href="/p/{item.product_slug}">
									{#if item.image}
										<picture>
											{#if item.image.avif_url}<source
													srcset={item.image.avif_url}
													type="image/avif"
												/>{/if}
											{#if item.image.webp_url}<source
													srcset={item.image.webp_url}
													type="image/webp"
												/>{/if}
											<img
												src={item.image.url}
												alt={item.image.alt_text || item.name}
												width="112"
												height="112"
												loading="lazy"
												decoding="async"
												class="size-24 rounded-xl bg-gray-100 object-cover sm:size-28 dark:bg-neutral-800"
											/>
										</picture>
									{:else}
										<div
											class="size-24 rounded-xl bg-gray-100 sm:size-28 dark:bg-neutral-800"
										></div>
									{/if}
								</a>
							</div>

							<!-- Info -->
							<div class="flex min-w-0 grow flex-col">
								<div class="flex items-start justify-between gap-x-3">
									<div class="min-w-0">
										<p class="text-sm font-medium text-gray-900 dark:text-white">
											<a href="/p/{item.product_slug}" class="hover:underline"
												>{item.name}</a
											>
										</p>
										{#if item.variant_name && item.variant_name !== item.name}
											<p class="mt-0.5 text-sm text-gray-600 dark:text-neutral-300">
												{item.variant_name}
											</p>
										{/if}
										<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
											{#if item.compare_at_price}
												<s class="me-1">{formatMoney(item.compare_at_price)}</s>
											{/if}
											<span
												class={item.compare_at_price
													? 'font-semibold text-red-600'
													: 'font-medium text-gray-900 dark:text-white'}
												>{formatMoney(item.unit_price)}</span
											>
											<span class="text-xs"> / vnt.</span>
										</p>
										{#if item.stock_available > 0 && item.stock_available <= Math.max(5, item.qty)}
											<p class="mt-1 text-xs font-medium text-orange-600">
												Mažas likutis — liko {item.stock_available} vnt.
											</p>
										{/if}
									</div>

									<!-- Remove (su „į mėgstamas?" prompt'u) -->
									{#if confirmRemoveId === item.id}
										<span class="flex shrink-0 items-center gap-1.5 text-xs">
											<span class="text-gray-500 dark:text-neutral-400"
												>Į mėgstamas?</span
											>
											<form
												method="POST"
												action="?/fav_remove"
												use:enhance={refresh}
											>
												<input type="hidden" name="item_id" value={item.id} />
												<input
													type="hidden"
													name="variant_id"
													value={item.variant_id}
												/>
												<button
													type="submit"
													class="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground hover:bg-secondary-hover"
													>Taip</button
												>
											</form>
											<form method="POST" action="?/remove" use:enhance={refresh}>
												<input type="hidden" name="item_id" value={item.id} />
												<button
													type="submit"
													class="rounded-md border border-gray-200 px-2 py-1 text-gray-500 hover:bg-gray-50 dark:border-neutral-700"
													>Ne</button
												>
											</form>
										</span>
									{:else}
										<button
											type="button"
											onclick={() => (confirmRemoveId = item.id)}
											class="shrink-0 text-gray-400 hover:text-primary"
											aria-label="Pašalinti"><Trash2 class="size-4" /></button
										>
									{/if}
								</div>

								<!-- Variantas + kiekis + remove -->
								<div class="mt-auto flex flex-wrap items-end gap-x-8 gap-y-2 pt-3">
									{#if item.options?.length}
										<div>
											<p class="text-xs text-gray-400">Variantas</p>
											<p class="mt-0.5 text-sm text-gray-700 dark:text-neutral-300">
												{#each item.options as opt, oi}
													{opt.option_value_label}{oi < item.options.length - 1
														? ' · '
														: ''}
												{/each}
											</p>
										</div>
									{/if}
									<div>
										<p class="text-xs text-gray-400">Kiekis</p>
										<form method="POST" action="?/update" use:enhance={refresh} class="mt-0.5">
											<input type="hidden" name="item_id" value={item.id} />
											<select
												name="qty"
												onchange={(e) =>
													(e.target as HTMLSelectElement).form?.requestSubmit()}
												class="rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
											>
												{#each Array(Math.min(99, Math.max(10, item.qty))) as _, i}
													<option value={i + 1} selected={item.qty === i + 1}
														>{i + 1}</option
													>
												{/each}
											</select>
										</form>
									</div>
									<div class="ms-auto text-end">
										<p class="text-xs text-gray-400">Suma</p>
										<p class="mt-0.5 font-semibold text-gray-900 dark:text-white">
											{formatMoney(item.line_total)}
										</p>
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Order summary -->
			<aside
				class="h-fit rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-neutral-700 dark:bg-neutral-900"
			>
				<h2 class="text-base font-semibold text-gray-900 dark:text-white">
					Užsakymo suvestinė
				</h2>
				<dl class="mt-4 space-y-2.5 text-sm">
					<div class="flex justify-between">
						<dt class="text-gray-500 dark:text-neutral-400">Prekės</dt>
						<dd class="font-medium text-gray-900 dark:text-white">
							{formatMoney(cart.items_total)}
						</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500 dark:text-neutral-400">Pristatymas</dt>
						<dd class="text-gray-400">paskaičiuojama</dd>
					</div>
					<div>
						<dt class="text-gray-500 dark:text-neutral-400">Nuolaidos kodas</dt>
						<dd class="mt-1.5">
							<div class="flex gap-2">
								<input
									type="text"
									bind:value={couponCode}
									placeholder="Įveskite kodą"
									class="min-w-0 grow rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
								/>
								<button
									type="button"
									onclick={applyCoupon}
									class="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white dark:border-neutral-600 dark:text-neutral-200"
									>Pritaikyti</button
								>
							</div>
						</dd>
					</div>
					<div
						class="flex justify-between border-t border-gray-200 pt-3 dark:border-neutral-700"
					>
						<dt class="font-semibold text-gray-900 dark:text-white">Iš viso</dt>
						<dd class="text-lg font-bold text-gray-900 dark:text-white">
							{formatMoney(cart.items_total)}
						</dd>
					</div>
				</dl>

				{#if cart.delivery_window}
					<p class="mt-3 text-xs text-gray-500 dark:text-neutral-400">
						Numatomas pristatymas: {cart.delivery_window.min_date} – {cart
							.delivery_window.max_date}
					</p>
				{/if}
				<a
					href="/checkout"
					class="mt-4 block rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
					>Apmokėti</a
				>
			</aside>
		</div>

		<!-- Trust badges -->
		<div
			class="mt-12 grid grid-cols-1 gap-4 border-t border-gray-200 pt-8 sm:grid-cols-3 dark:border-neutral-700"
		>
			<div class="flex items-center gap-x-3">
				<ShieldCheck class="size-7 shrink-0 text-gray-400" />
				<div>
					<p class="text-sm font-medium text-gray-900 dark:text-white">
						Saugus atsiskaitymas
					</p>
					<p class="text-xs text-gray-500 dark:text-neutral-400">
						Šifruotas ryšys, saugūs mokėjimai
					</p>
				</div>
			</div>
			<div class="flex items-center gap-x-3">
				<Truck class="size-7 shrink-0 text-gray-400" />
				<div>
					<p class="text-sm font-medium text-gray-900 dark:text-white">
						Pristatymas visoje Lietuvoje
					</p>
					<p class="text-xs text-gray-500 dark:text-neutral-400">
						Paštomatai, kurjeris arba atsiėmimas
					</p>
				</div>
			</div>
			<div class="flex items-center gap-x-3">
				<RotateCcw class="size-7 shrink-0 text-gray-400" />
				<div>
					<p class="text-sm font-medium text-gray-900 dark:text-white">
						14 d. grąžinimo garantija
					</p>
					<p class="text-xs text-gray-500 dark:text-neutral-400">
						Pirkimas be rizikos
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="rounded-xl border border-dashed border-gray-300 py-20 text-center dark:border-neutral-700"
		>
			<ShoppingBag class="mx-auto size-12 text-gray-300 dark:text-neutral-600" />
			<p class="mt-4 text-gray-500 dark:text-neutral-400">Krepšelis tuščias.</p>
			<a
				href="/katalogas"
				class="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
				>Tęsti apsipirkimą</a
			>
		</div>
	{/if}

	{#if form?.error}
		<p class="mt-4 text-sm text-primary">{form.error}</p>
	{/if}
</div>
