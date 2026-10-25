<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import { Heart, ShoppingCart } from '@lucide/svelte';
	import type { FavoriteItemOut } from '#lib/api/types';

	let { data, form } = $props();
	const items = $derived<FavoriteItemOut[]>(data.favorites?.items ?? []);
	const me = $derived(data.me);

	// Pasirinktas variantas kortelėje (default — tas, kuris buvo užfavoruotas).
	let chosenVariant = $state<Record<number, number>>({});
	const variantOf = (item: FavoriteItemOut) =>
		chosenVariant[item.favorite_id] ?? item.variant_id;

	const refresh = () => {
		return async ({ result }: { result: { type: string } }) => {
			if (result.type === 'success') await invalidateAll();
		};
	};

	const srcset = (s?: { url: string; width: number }[]) =>
		s?.length ? s.map((i) => `${i.url} ${i.width}w`).join(', ') : undefined;
</script>

<svelte:head>
	<title>Mėgstamos prekės — Baltijos Žvynas</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto w-full max-w-340 px-4 py-10 sm:px-6 lg:px-8">
	<div class="mb-8 text-center">
		<h1 class="text-2xl font-bold text-foreground">Mėgstamos prekės</h1>
		{#if !me}
			<p class="mt-2 text-sm text-muted-foreground-1">
				Kad mėgstamos būtų pasiekiamos ir vėliau — <a
					href="/prisijungti?next=/megstamos"
					class="text-foreground underline underline-offset-4 hover:text-primary-hover"
					>prisijunkite</a
				>
				arba
				<a
					href="/prisijungti?next=/megstamos"
					class="text-foreground underline underline-offset-4 hover:text-primary-hover"
					>susikurkite paskyrą</a
				>.
			</p>
		{/if}
	</div>

	{#if items.length}
		<ul
			class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
		>
			{#each items as item (item.favorite_id)}
				{@const p = item.product}
				{@const img = p.images[0]}
				{@const selId = variantOf(item)}
				{@const selVariant = item.variants.find((v) => v.id === selId)}
				<li class="group flex flex-col">
					<div class="relative">
						<a href="/p/{p.slug}" class="block overflow-hidden rounded-xl bg-surface">
							{#if img}
								<picture>
									{#if img.avif_srcset?.length}<source
											srcset={srcset(img.avif_srcset)}
											sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
											type="image/avif"
										/>{/if}
									{#if img.webp_srcset?.length}<source
											srcset={srcset(img.webp_srcset)}
											sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
											type="image/webp"
										/>{/if}
									<img
										src={img.url}
										alt={img.alt_text || p.name}
										loading="lazy"
										decoding="async"
										class="aspect-square w-full object-cover transition-transform group-hover:scale-105"
									/>
								</picture>
							{:else}
								<div class="aspect-square w-full"></div>
							{/if}
						</a>

						{#if p.discount_percent}
							<span
								class="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground"
								>−{p.discount_percent}%</span
							>
						{/if}

						<!-- Heart toggle = pašalinti iš mėgstamų -->
						<form
							method="POST"
							action="?/fav_remove"
							use:enhance={refresh}
							class="absolute right-2 top-2"
						>
							<input type="hidden" name="variant_id" value={item.variant_id} />
							<button
								type="submit"
								aria-label="Pašalinti iš mėgstamų"
								title="Pašalinti iš mėgstamų"
								class="flex size-8 items-center justify-center rounded-full bg-layer shadow-sm ring-1 ring-layer-line transition hover:bg-layer-hover focus:outline-hidden"
							>
								<Heart class="size-4 fill-current text-destructive" />
							</button>
						</form>
					</div>

					<div class="mt-3 flex grow flex-col">
						{#if p.brand}
							<p class="text-xs text-muted-foreground-1">{p.brand.name}</p>
						{/if}
						<a
							href="/p/{p.slug}"
							class="mt-0.5 text-sm font-medium text-foreground hover:underline"
							>{p.name}</a
						>
						<p class="mt-1 text-sm font-semibold text-foreground">
							{formatMoney(p.price)}
							{#if p.compare_at_price}
								<s class="ms-1 font-normal text-muted-foreground-1"
									>{formatMoney(p.compare_at_price)}</s
								>
							{/if}
						</p>

						<div class="mt-3 flex flex-col gap-2">
							{#if item.variants.length > 1}
								<select
									aria-label="Variantas"
									value={selId}
									onchange={(e) =>
										(chosenVariant[item.favorite_id] = Number(
											(e.target as HTMLSelectElement).value
										))}
									class="w-full rounded-lg border border-layer-line bg-layer px-2 py-2 text-xs text-layer-foreground"
								>
									{#each item.variants as v (v.id)}
										<option value={v.id}
											>{v.label}{v.in_stock ? '' : ' — nėra'}</option
										>
									{/each}
								</select>
							{:else if selVariant && !selVariant.in_stock}
								<p class="text-xs text-muted-foreground-1">Šiuo metu nėra</p>
							{/if}

							<form method="POST" action="?/cart_add" use:enhance={refresh}>
								<input type="hidden" name="variant_id" value={selId} />
								<button
									type="submit"
									disabled={!(selVariant?.in_stock ?? true)}
									class="inline-flex w-full items-center justify-center gap-x-1.5 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none"
								>
									<ShoppingCart class="size-3.5" /> Į krepšelį
								</button>
							</form>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<div
			class="mx-auto max-w-md rounded-xl border border-dashed border-line-1 py-20 text-center"
		>
			<Heart class="mx-auto size-12 text-line-2" />
			<p class="mt-4 text-muted-foreground-1">
				Mėgstamų prekių dar nėra — pažymėkite širdele prie prekės.
			</p>
			<a
				href="/katalogas"
				class="mt-4 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
				>Tęsti apsipirkimą</a
			>
		</div>
	{/if}

	{#if form?.error}
		<p class="mt-4 text-center text-sm text-destructive">{form.error}</p>
	{/if}
</div>
