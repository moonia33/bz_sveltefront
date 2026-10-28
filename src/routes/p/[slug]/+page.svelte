<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { marked } from 'marked';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
	import ProductRow from '#lib/components/ui/ProductRow.svelte';
	import AnimatedShop from '#lib/components/icons/AnimatedShop.svelte';
	import AnimatedStopwatch from '#lib/components/icons/AnimatedStopwatch.svelte';
	import AnimatedTrolley from '#lib/components/icons/AnimatedTrolley.svelte';
	import { formatMoney } from '#lib/money';
	import { pushToast } from '#lib/toast';
	import { jsonLd } from '#lib/seo';
	import { browser } from '$app/env';
	import 'photoswipe/dist/photoswipe.css';
	import {
		Check,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		Heart,
		Image as ImageIcon,
		MailCheck,
		Package,
		Play,
		ShieldCheck,
		Shirt,
		ShoppingCart,
		Store,
		Undo2,
		Warehouse,
		ZoomIn
	} from '@lucide/svelte';
	import type { DeliveryWindowOut, MoneyOut, ProductFeatureOut, VariantOut } from '#lib/api/types';

	let { data, form } = $props();
	const product = $derived(data.product);
	const variants = $derived(product.variants.filter((v: VariantOut) => v.is_active));

	type OptionGroup = {
		code: string;
		name: string;
		values: { code: string; label: string; sort: number }[];
	};

	const optionGroups = $derived.by<OptionGroup[]>(() => {
		const groups = new Map<string, OptionGroup & { seen: Map<string, number> }>();
		for (const v of variants) {
			for (const o of v.options) {
				let g = groups.get(o.option_type_code);
				if (!g) {
					g = {
						code: o.option_type_code,
						name: o.option_type_name,
						values: [],
						seen: new Map()
					};
					groups.set(o.option_type_code, g);
				}
				if (!g.seen.has(o.option_value_code)) {
					const sort = o.option_value_sort ?? 0;
					g.seen.set(o.option_value_code, sort);
					g.values.push({ code: o.option_value_code, label: o.option_value_label, sort });
				}
			}
		}
		// Reikšmės rikiuojamos pagal OptionValue.sort_order (admin), fallback — label
		const natural = (a: string, b: string) =>
			a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
		for (const g of groups.values()) {
			g.values.sort((x, y) => x.sort - y.sort || natural(x.label, y.label));
		}
		return [...groups.values()];
	});

	let selection = $state<Record<string, string>>({});
	// Kai options nėra – variantas renkamas tiesiogiai pagal sku
	// (URL ?v=<sku> preselect, jei yra).
	let selectedSku = $state<string | null>(page.url.searchParams.get('v'));
	let qty = $state(1);
	let addedFlash = $state(false);
	let addBusy = $state(false);
	let favBusy = $state(false);

	function matchesAll(v: VariantOut, sel: Record<string, string>): boolean {
		return Object.entries(sel).every(
			([typeCode, valueCode]) =>
				v.options.some(
					(o) => o.option_type_code === typeCode && o.option_value_code === valueCode
				)
		);
	}

	const selectedVariant = $derived.by<VariantOut | null>(() => {
		if (!variants.length) return null;
		if (!optionGroups.length) {
			if (variants.length > 1) {
				const bySku = variants.find((v) => v.sku === selectedSku);
				if (bySku) return bySku;
				return variants.find((v) => v.stock_available > 0) ?? variants[0];
			}
			return variants[0];
		}
		const exact = variants.find(
			(v) =>
				v.options.length === optionGroups.length &&
				v.options.every(
					(o) => selection[o.option_type_code] === o.option_value_code
				)
		);
		if (exact) return exact;
		// Partial selection → first variant matching chosen options.
		return variants.find((v) => matchesAll(v, selection)) ?? null;
	});

	const missingGroups = $derived(
		optionGroups.filter((g) => !selection[g.code])
	);
	const selectionComplete = $derived(missingGroups.length === 0);

	function valueAvailable(typeCode: string, valueCode: string): boolean {
		return variants.some((v) =>
			matchesAll(v, { ...selection, [typeCode]: valueCode })
		);
	}

	const images = $derived.by(() => {
		const imgs = [...(selectedVariant?.images ?? []), ...product.images];
		const seen = new Set<string>();
		return imgs.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
	});

	// Galerijos skaidrės: nuotraukos + video kaip papildomi „slide'ai".
	// BE video yra išorinės nuorodos (tiekėjo feed'as) — praktiškai visada YouTube,
	// tad juos embed'iname per iframe; tiesioginiams failams lieka <video>.
	function youtubeEmbedUrl(url: string): string | null {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^(www\.|m\.)/, '');
			let id: string | null = null;
			if (host === 'youtu.be') {
				id = u.pathname.slice(1).split('/')[0] || null;
			} else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
				if (u.pathname === '/watch') id = u.searchParams.get('v');
				else {
					const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
					if (m) id = m[2];
				}
			}
			return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
		} catch {
			return null;
		}
	}

	type Slide = {
		kind: 'image' | 'video';
		url: string;
		alt: string;
		embed?: string | null;
		srcsetAvif?: string;
		srcsetWebp?: string;
		full?: string | null;
		fullW?: number;
		fullH?: number;
	};
	const srcsetOf = (s?: { url: string; width: number }[]) =>
		s?.length ? s.map((i) => `${i.url} ${i.width}w`).join(', ') : undefined;
	const slides = $derived.by<Slide[]>(() => [
		...images.map((i) => ({
			kind: 'image' as const,
			url: i.url,
			alt: i.alt_text || product.name,
			srcsetAvif: srcsetOf(i.avif_srcset),
			srcsetWebp: srcsetOf(i.webp_srcset),
			full: i.full_url,
			fullW: i.full_width || 0,
			fullH: i.full_height || 0
		})),
		...(product.videos ?? []).map((v) => ({
			kind: 'video' as const,
			url: v.url,
			alt: product.name,
			embed: youtubeEmbedUrl(v.url)
		}))
	]);
	let activeSlide = $state(0);
	const slide = $derived(slides[activeSlide]);

	// Lightbox — PhotoSwipe (dinamiškai, tik browser'yje). Tik image slide'ai.
	async function openLightbox(slideIndex: number) {
		if (!browser) return;
		const imageSlides = slides
			.map((s, i) => ({ s, i }))
			.filter((x) => x.s.kind === 'image');
		if (!imageSlides.length) return;

		const index = Math.max(
			0,
			imageSlides.findIndex((x) => x.i === slideIndex)
		);

		const measure = (src: string) =>
			new Promise<{ w: number; h: number }>((res) => {
				const im = new Image();
				im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
				im.onerror = () => res({ w: 1200, h: 1200 });
				im.src = src;
			});

		// Tikrūs w/h — PhotoSwipe juos reikalauja. Backend duoda originalo
		// dims; trūkstant — matuojam d800 rendition'o (mažas, greitis) ir
		// ×4 pakeliam: aspect'as identiškas originalui, o perdėtas zoom
		// limitas nekenkia (originalas vistiek lieka aštrus).
		const dataSource = await Promise.all(
			imageSlides.map(async (x) => {
				const src = x.s.full || x.s.url;
				let dims: { w: number; h: number };
				if (x.s.fullW && x.s.fullH) {
					dims = { w: x.s.fullW, h: x.s.fullH };
				} else {
					const d = await measure(x.s.url);
					dims = { w: d.w * 4, h: d.h * 4 };
				}
				return {
					src,
					msrc: x.s.url,
					alt: x.s.alt,
					width: dims.w,
					height: dims.h
				};
			})
		);

		const { default: PhotoSwipe } = await import('photoswipe');
		const pswp = new PhotoSwipe({
			dataSource,
			index,
			bgOpacity: 0.92,
			wheelToZoom: true,
			zoom: false,
			padding: { top: 48, bottom: 48, left: 24, right: 24 }
		});
		pswp.init();
	}
	$effect(() => {
		if (activeSlide > slides.length - 1) activeSlide = 0;
	});

	const price = $derived(selectedVariant?.price ?? variants[0]?.price);
	// Nepilnai pasirinkus — rodome minimalią kainą su „nuo" prefiksu
	const priceRange = $derived.by(() => {
		if (selectionComplete || !variants.length) return null;
		const priced = variants
			.filter((v) => matchesAll(v, selection))
			.map((v) => v.price)
			.filter((p): p is MoneyOut => p != null);
		if (!priced.length) return null;
		const sorted = [...priced].sort((a, b) => Number(a.gross) - Number(b.gross));
		const min = sorted[0];
		const max = sorted[sorted.length - 1];
		return { min, max: Number(max.gross) !== Number(min.gross) ? max : null };
	});
	const cheapestGross = $derived(
		variants.length ? Math.min(...variants.map((v) => v.price?.gross ?? Infinity)) : 0
	);

	// Sandėlio likučiai: parduotuvė + nuotolinis sandėlys (stock_local/stock_remote
	// pagal Warehouse.kind; senesnėms BE versijoms — fallback į stock_available).
	const localQty = $derived(
		selectedVariant?.stock_local?.qty ?? selectedVariant?.stock_available ?? 0
	);
	const localDw = $derived(
		selectedVariant?.stock_local?.delivery_window ?? product.delivery_window
	);
	const remoteQty = $derived<number | null | undefined>(
		selectedVariant?.stock_remote?.qty
	);
	const remoteDw = $derived<DeliveryWindowOut | null | undefined>(
		selectedVariant?.stock_remote?.delivery_window
	);
	const totalQty = $derived(localQty + (remoteQty ?? 0));

	// Mėgstamų būsena pasirinktam variantui (užpildyta širdelė).
	const isFav = $derived(
		selectedVariant != null &&
			(data.favorite_ids ?? []).includes(selectedVariant.id)
	);

	// ETA vežėjams: iš to sandėlio, iš kurio realiai siunčiama
	// (local > remote > produkto best-offer window).
	const etaDw = $derived(
		localQty > 0 ? (localDw ?? remoteDw) : (remoteDw ?? localDw)
	);

	// Sandėlių sekcijos ETA span'as: nuo trumpiausio varianto
	// (atsiėmimas vietoje, kai yra local stock) iki vėliausios datos.
	const etaSpan = $derived.by(() => {
		const maxes: string[] = [];
		if (localQty > 0 && localDw?.max_date) maxes.push(localDw.max_date);
		if ((remoteQty ?? 0) > 0 && remoteDw?.max_date)
			maxes.push(remoteDw.max_date);
		const today = new Date().toISOString().slice(0, 10);
		const min = localQty > 0 ? today : [...maxes].sort()[0];
		let max = maxes.sort().at(-1);
		if (!max && localQty > 0) {
			const d = new Date();
			d.setDate(d.getDate() + 1);
			max = d.toISOString().slice(0, 10);
		}
		if (!min || !max) return null;
		return min === max ? fmtDate(max) : `${fmtDate(min)} – ${fmtDate(max)}`;
	});

	// PDP pristatymo metodai iš /shipping/methods: vežėjai + atsiėmimas atskirai.
	const shippingMethods = $derived(data.shipping_methods ?? []);
	const carrierMethods = $derived(
		shippingMethods.filter((m) => m.code !== 'store_pickup')
	);
	const pickupMethods = $derived(
		shippingMethods.filter((m) => m.code === 'store_pickup')
	);

	// Option reikšmės → atstovaujančio varianto nuotrauka (variantų „swatch" su thumb).
	const valueThumbs = $derived.by(() => {
		const m = new Map<string, string>();
		for (const g of optionGroups) {
			for (const val of g.values) {
				const v = variants.find(
					(v) =>
						v.images?.length &&
						v.options.some(
							(o) =>
								o.option_type_code === g.code &&
								o.option_value_code === val.code
						)
				);
				if (v) m.set(`${g.code}:${val.code}`, v.images[0].url);
			}
		}
		return m;
	});

	// Specifikacijos: produkto features + pasirinkto varianto features
	// (varianto reikšmė laimi tų pačių feature_code kolizijose).
	const specs = $derived.by<ProductFeatureOut[]>(() => {
		const map = new Map<string, ProductFeatureOut>();
		for (const f of product.features ?? []) map.set(f.feature_code, f);
		for (const f of selectedVariant?.features ?? []) map.set(f.feature_code, f);
		return [...map.values()];
	});

	// Pakuotės info: trade_pack_qty (gamintojo dėžė) arba pack_quantity.
	const packInfo = $derived.by(() => {
		const v = selectedVariant;
		if (!v) return null;
		const qtyInPack = v.trade_pack_qty || v.pack_quantity;
		if (!v.sold_as_pack && !qtyInPack) return null;
		const unitGross =
			v.sold_as_pack && qtyInPack > 0 && price ? Number(price.gross) / qtyInPack : null;
		return {
			qty: qtyInPack,
			unit: v.pack_unit || 'vnt.',
			soldAsPack: v.sold_as_pack,
			unitPrice:
				unitGross != null
					? new Intl.NumberFormat('lt-LT', {
							style: 'currency',
							currency: (price?.currency || 'EUR').toUpperCase()
						}).format(unitGross)
					: null
		};
	});

	function fmtDate(iso: string): string {
		return new Intl.DateTimeFormat('lt-LT', { month: 'long', day: 'numeric' }).format(
			new Date(iso)
		);
	}

	function dwText(dw: DeliveryWindowOut | null | undefined): string {
		if (!dw) return '';
		if (dw.min_date && dw.max_date && dw.min_date !== dw.max_date) {
			return `${fmtDate(dw.min_date)} – ${fmtDate(dw.max_date)}`;
		}
		return `iki ${fmtDate(dw.max_date || dw.min_date)}`;
	}

	// Spalvų „swatch" heuristika: hex / rgb() / hsl() arba žinomas CSS spalvos vardas.
	const CSS_COLORS = new Set([
		'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
		'pink', 'brown', 'grey', 'gray', 'beige', 'ivory', 'khaki', 'navy',
		'olive', 'teal', 'turquoise', 'cyan', 'magenta', 'maroon', 'silver',
		'gold', 'lime', 'aqua', 'coral', 'salmon', 'violet', 'indigo',
		'lavender', 'tan', 'burgundy', 'charcoal', 'sand', 'cream', 'mint'
	]);

	function isColorValue(code: string): boolean {
		const c = code.trim().toLowerCase();
		return (
			/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c) ||
			/^(rgb|hsl)a?\(/i.test(c) ||
			CSS_COLORS.has(c)
		);
	}

	function groupIsColor(group: OptionGroup): boolean {
		return group.values.length > 0 && group.values.every((v) => isColorValue(v.code));
	}

	function md(payload: Record<string, unknown>): string {
		// breaks:true — tiekėjų aprašymuose naudojamos viengubos eilutės
		// su „•" glifais; be breaks jos sukollapsuotų į vieną <p>.
		return marked.parse(String(payload?.markdown ?? payload?.text ?? ''), {
			async: false,
			breaks: true
		});
	}

	// Description yra Markdown — renderuojame per marked (raw {@html}
	// suspaustų naujas eilutes į vieną).
	const descHtml = $derived(
		product.description ? md({ markdown: product.description }) : ''
	);

	// --- SEO ---
	const plainDesc = $derived(
		descHtml
			.replace(/<[^>]+>/g, ' ')
			.replace(/\s+/g, ' ')
			.trim()
	);
	const metaTitle = $derived(`${product.seo_title || product.name} — Baltijos Žvynas`);
	const metaDesc = $derived(product.seo_description || plainDesc.slice(0, 160));
	const canonical = $derived(`${data.origin}/p/${product.slug}`);
	const ogImage = $derived(images[0]?.url);

	const productLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: product.name,
			sku: selectedVariant?.sku ?? product.sku,
			image: images.map((i) => i.url),
			...(product.brand
				? { brand: { '@type': 'Brand', name: product.brand.name } }
				: {}),
			description: plainDesc,
			...(price
				? {
						offers: {
							'@type': 'Offer',
							priceCurrency: (price.currency || 'EUR').toUpperCase(),
							price: String(price.gross),
							availability:
								totalQty > 0
									? 'https://schema.org/InStock'
									: 'https://schema.org/OutOfStock',
							url: canonical
						}
					}
				: {})
		})
	);

	const breadcrumbLd = $derived(
		jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ '@type': 'ListItem', position: 1, name: 'Pradžia', item: `${data.origin}/` },
				...(product.category
					? [
							{
								'@type': 'ListItem',
								position: 2,
								name: product.category.name,
								item: `${data.origin}/k/${product.category.slug}`
							}
						]
					: []),
				{
					'@type': 'ListItem',
					position: product.category ? 3 : 2,
					name: product.name,
					item: canonical
				}
			]
		})
	);
</script>

{#snippet stockStatus(q: number | null | undefined)}
	{@const qty = q ?? 0}
	{#if qty > 5}
		<span class="text-green-600 dark:text-green-400">Yra</span>
	{:else if qty > 0}
		<span class="text-orange-500">Mažas likutis ({qty} vnt.)</span>
	{:else}
		<span class="text-muted-foreground-1">Nėra</span>
	{/if}
{/snippet}

<svelte:head>
	<title>{metaTitle}</title>
	{#if metaDesc}
		<meta name="description" content={metaDesc} />
	{/if}
	<link rel="canonical" href={canonical} />
	<meta property="og:title" content={metaTitle} />
	{#if metaDesc}
		<meta property="og:description" content={metaDesc} />
	{/if}
	<meta property="og:type" content="product" />
	<meta property="og:url" content={canonical} />
	{#if ogImage}
		<meta property="og:image" content={ogImage} />
	{/if}
	{@html productLd}
	{@html breadcrumbLd}
</svelte:head>

<div class="w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
	<div class="py-5">
		<!-- Breadcrumb -->
		<ol class="flex items-center whitespace-nowrap">
			<li class="flex items-center">
				<a
					class="py-0.5 px-1.5 flex items-center gap-x-1 text-sm rounded-md text-foreground hover:bg-surface-hover focus:bg-surface-focus focus:outline-hidden"
					href="/"
				>
					Pradžia
				</a>
				<svg
					class="shrink-0 overflow-visible size-4 text-muted-foreground"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<path d="M6 13L10 3" stroke="currentColor" stroke-linecap="round"></path>
				</svg>
			</li>
			{#if product.category}
				<li class="flex items-center truncate">
					<a
						class="py-0.5 px-1.5 flex items-center truncate gap-x-1 text-sm rounded-md text-foreground hover:bg-surface-hover focus:bg-surface-focus focus:outline-hidden"
						href="/k/{product.category.slug}"
					>
						<span class="truncate">{product.category.name}</span>
					</a>
					<svg
						class="shrink-0 overflow-visible size-4 text-muted-foreground"
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<path d="M6 13L10 3" stroke="currentColor" stroke-linecap="round"></path>
					</svg>
				</li>
			{/if}
			<li class="ps-1.5 flex items-center truncate font-semibold text-foreground text-sm">
				<span class="truncate">{product.name}</span>
			</li>
		</ol>
		<!-- End Breadcrumb -->
	</div>

	<!-- Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3">
		<!-- Kairė: galerija + akordeonas (mobile'e `contents` – galerija → sidebar → akordeonas) -->
		<div class="contents lg:col-span-2 lg:block">
			<!-- Gallery -->
			<div class="order-1">
				<div class="relative">
					<div class="flex flex-col sm:flex-row gap-3 sm:gap-5">
						{#if slides.length > 1}
							<!-- Thumbnails -->
							<div class="flex-none order-2 sm:order-1">
								<div
									class="flex flex-row sm:flex-col gap-3 sm:h-175 pb-1.5 sm:pb-0 overflow-x-auto sm:overflow-y-auto scrollbar-none"
								>
									{#each slides as s, i (s.url)}
										<button
											type="button"
											onclick={() => (activeSlide = i)}
											aria-label="Nuotrauka {i + 1}"
											aria-current={i === activeSlide}
											class="relative shrink-0 size-20 rounded-md sm:rounded-lg overflow-hidden cursor-pointer {i ===
											activeSlide
												? 'ring-2 ring-primary-checked ring-inset'
												: ''}"
										>
											{#if s.kind === 'image'}
												<img
													src={s.url}
													alt={s.alt}
													loading="lazy"
													class="size-full object-cover rounded-md sm:rounded-lg"
												/>
											{:else}
												<span
													class="flex size-full items-center justify-center bg-surface text-muted-foreground-1 rounded-md sm:rounded-lg"
												>
													<Play class="size-6" />
												</span>
											{/if}
										</button>
									{/each}
								</div>
							</div>
							<!-- End Thumbnails -->
						{/if}

						<!-- Preview -->
						<div
							class="relative grow overflow-hidden h-137.5 sm:h-175 order-1 sm:order-2 bg-surface rounded-lg"
						>
							{#key activeSlide}
								{#if slide?.kind === 'image'}
									<button
										type="button"
										onclick={() => openLightbox(activeSlide)}
										aria-label="Padidinti nuotrauką"
										class="block size-full cursor-zoom-in"
									>
										<picture>
											{#if slide.srcsetAvif}<source srcset={slide.srcsetAvif} sizes="(min-width: 640px) 700px, 100vw" type="image/avif" />{/if}
											{#if slide.srcsetWebp}<source srcset={slide.srcsetWebp} sizes="(min-width: 640px) 700px, 100vw" type="image/webp" />{/if}
											<img
												src={slide.url}
												data-full={slide.full ?? undefined}
												alt={slide.alt}
												transition:fade={{ duration: 200 }}
												class="size-full object-contain"
											/>
										</picture>
									</button>
								{:else if slide?.kind === 'video'}
									{#if slide.embed}
										<iframe
											src={slide.embed}
											title={slide.alt}
											loading="lazy"
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
											allowfullscreen
											referrerpolicy="strict-origin-when-cross-origin"
											class="size-full border-0"
										></iframe>
									{:else}
										<!-- svelte-ignore a11y_media_has_caption -->
										<video
											controls
											preload="none"
											transition:fade={{ duration: 200 }}
											class="size-full object-contain"
										>
											<source src={slide.url} />
										</video>
									{/if}
								{:else}
									<div
										class="flex size-full items-center justify-center text-muted-foreground"
									>
										<ImageIcon class="size-16" />
									</div>
								{/if}
							{/key}

							{#if slide?.kind === 'image'}
								<button
									type="button"
									onclick={() => openLightbox(activeSlide)}
									aria-label="Padidinti nuotrauką"
									class="absolute top-3 end-3 inline-flex justify-center items-center size-10 bg-layer/80 backdrop-blur border border-layer-line text-layer-foreground rounded-full shadow-2xs hover:bg-layer-hover focus:outline-hidden"
								>
									<ZoomIn class="size-5" />
								</button>
							{/if}

							{#if slides.length > 1}
								<!-- Nav -->
								<div class="absolute bottom-0 inset-e-0 pb-4 pe-4">
									<div class="flex items-center gap-2">
										<button
											type="button"
											disabled={activeSlide <= 0}
											onclick={() => (activeSlide -= 1)}
											aria-label="Ankstesnė nuotrauka"
											class="inline-flex justify-center items-center size-10 bg-layer border border-layer-line text-layer-foreground rounded-full shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:cursor-default"
										>
											<ChevronLeft class="shrink-0 size-5" />
										</button>
										<button
											type="button"
											disabled={activeSlide >= slides.length - 1}
											onclick={() => (activeSlide += 1)}
											aria-label="Kita nuotrauka"
											class="inline-flex justify-center items-center size-10 bg-layer border border-layer-line text-layer-foreground rounded-full shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:cursor-default"
										>
											<ChevronRight class="shrink-0 size-5" />
										</button>
									</div>
								</div>
								<!-- End Nav -->
							{/if}
						</div>
						<!-- End Preview -->
					</div>

					{#if data.recommendations.length}
						<!-- Badge -->
						<div class="absolute top-0 inset-s-0 pt-2 ps-2">
							<a
								class="py-1.5 px-2 flex items-center gap-x-1.5 bg-layer font-medium text-xs text-layer-foreground rounded-full shadow-2xs"
								href="#rekomendacijos"
							>
								<Shirt class="shrink-0 size-4" />
								Derinti su
								<ChevronDown class="shrink-0 size-4" />
							</a>
						</div>
						<!-- End Badge -->
					{/if}
				</div>
			</div>
			<!-- End Gallery -->

			<!-- Accordion -->
			<div class="order-3 pt-14 pb-10">
				{#if product.description}
					<div class="border-b border-line-1">
						<details class="group" open>
							<summary
								class="py-4 inline-flex justify-between items-center gap-x-3 w-full font-medium text-start text-foreground cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden focus:outline-hidden"
							>
								Aprašymas
								<ChevronDown
									class="shrink-0 size-4 transition-transform group-open:rotate-180"
								/>
							</summary>
							<div class="pb-6">
								<div class="prose max-w-none dark:prose-invert">
									{@html descHtml}
								</div>
							</div>
						</details>
					</div>
				{/if}

				{#if specs.length}
					<div class="border-b border-line-1">
						<details class="group" open>
							<summary
								class="py-4 inline-flex justify-between items-center gap-x-3 w-full font-medium text-start text-foreground cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden focus:outline-hidden"
							>
								Specifikacijos
								<ChevronDown
									class="shrink-0 size-4 transition-transform group-open:rotate-180"
								/>
							</summary>
							<div class="pb-6">
								<dl
									class="divide-y divide-line-1 overflow-hidden rounded-xl border border-layer-line"
								>
									{#each specs as f, i (f.feature_code)}
										<div
											class="grid grid-cols-3 items-baseline gap-x-4 px-4 py-3 {i %
											2
												? 'bg-surface'
												: 'bg-layer'}"
										>
											<dt class="text-sm text-muted-foreground-1">
												{f.feature_name}
											</dt>
											<dd class="col-span-2 text-sm font-medium text-foreground">
												{f.value_label || f.value}
											</dd>
										</div>
									{/each}
								</dl>
							</div>
						</details>
					</div>
				{/if}

				<div class="border-b border-line-1">
					<details class="group">
						<summary
							class="py-4 inline-flex justify-between items-center gap-x-3 w-full font-medium text-start text-foreground cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden focus:outline-hidden"
						>
							Pristatymas ir grąžinimas
							<ChevronDown
								class="shrink-0 size-4 transition-transform group-open:rotate-180"
							/>
						</summary>
						<div class="pb-6">
							{#if shippingMethods.length}
								<ul class="space-y-2">
									{#each shippingMethods as m (m.code)}
										<li
											class="flex items-center justify-between gap-x-3 text-sm"
										>
											<span class="text-foreground">{m.name}</span>
											<span class="font-medium text-foreground">
												{Number(m.price.gross) > 0
													? formatMoney(m.price)
													: 'Nemokamai'}
											</span>
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-sm text-muted-foreground-1">
									Pristatymo būdą ir kainą parinksite atsiskaitymo metu.
								</p>
							{/if}
							<p class="mt-3 text-sm text-muted-foreground-1">
								Prekes galite grąžinti per 30 dienų nuo jų gavimo. Grąžinama
								prekė turi būti nenaudota, su originalia pakuote ir etiketėmis.
							</p>
						</div>
					</details>
				</div>

				{#each product.content_blocks ?? [] as block (block.key)}
					<div class="border-b border-line-1">
						<details class="group">
							<summary
								class="py-4 inline-flex justify-between items-center gap-x-3 w-full font-medium text-start text-foreground cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden focus:outline-hidden"
							>
								{block.title}
								<ChevronDown
									class="shrink-0 size-4 transition-transform group-open:rotate-180"
								/>
							</summary>
							<div class="pb-6">
								{#if block.type === 'markdown' || block.type === 'rich_text'}
									<div class="prose max-w-none dark:prose-invert">
										{@html md(block.payload ?? {})}
									</div>
								{:else if block.type === 'html'}
									<div class="prose max-w-none dark:prose-invert">
										{@html String(block.payload?.html ?? '')}
									</div>
								{:else if block.type === 'image'}
									{@const src = (block.payload?.src ?? block.payload?.url) as
										| string
										| undefined}
									{#if src}
										<img
											{src}
											alt={String(block.payload?.alt ?? block.title)}
											loading="lazy"
											decoding="async"
											class="w-full rounded-xl"
										/>
									{:else}
										<MissingFeature feature="Turinio blokas: image (be src/url)" />
									{/if}
								{:else}
									<MissingFeature feature={'Turinio blokas: ' + block.type} />
								{/if}
							</div>
						</details>
					</div>
				{/each}
			</div>
			<!-- End Accordion -->
		</div>
		<!-- End Col -->

		<!-- Dešinė: sticky sidebar -->
		<div class="order-2 lg:col-span-1">
			<div class="pt-14 lg:pt-0 lg:pb-20 lg:ps-10 lg:sticky lg:top-20">
				<!-- Product Details -->
				{#if product.category}
					<p class="mb-1 text-sm text-muted-foreground-1">
						{product.category.name}
					</p>
				{/if}

				<h1 class="font-semibold text-3xl text-foreground">
					{product.name}
				</h1>

				{#if product.brand}
					<a
						href="/g/{product.brand.slug}"
						class="mt-2 inline-flex items-center gap-x-2 text-sm text-muted-foreground-1 hover:text-foreground focus:outline-hidden focus:text-foreground"
					>
						{#if product.brand.logo_thumb_url || product.brand.logo_url}
							<img
								src={product.brand.logo_thumb_url ?? product.brand.logo_url ?? ''}
								alt={product.brand.name}
								decoding="async"
								class="size-7 shrink-0 rounded-md border border-layer-line bg-layer object-contain p-0.5"
							/>
						{/if}
						<span class="underline underline-offset-4">{product.brand.name}</span>
					</a>
				{/if}

				<p class="mt-1 font-medium text-lg text-foreground">
					{#if priceRange}
						nuo {formatMoney(priceRange.min)}
						{#if priceRange.max}– {formatMoney(priceRange.max)}{/if}
					{:else}
						{formatMoney(price)}
					{/if}
					{#if selectedVariant?.compare_at_price}
						<s class="text-muted-foreground-1"
							>{formatMoney(selectedVariant.compare_at_price)}</s
						>
						{#if selectedVariant.discount_percent}
							<span class="text-destructive"
								>−{selectedVariant.discount_percent}%</span
							>
						{/if}
					{/if}
				</p>

				{#if packInfo}
					<p class="mt-1.5 flex items-center gap-x-1.5 text-sm text-muted-foreground-1">
						<Package class="size-4 shrink-0" />
						{#if packInfo.soldAsPack}
							Kaina už pilną pakuotę ({packInfo.qty} {packInfo.unit})
							{#if packInfo.unitPrice}
								· {packInfo.unitPrice}/{packInfo.unit}
							{/if}
						{:else}
							Pakuotėje: {packInfo.qty} {packInfo.unit}
						{/if}
					</p>
				{/if}

				<p class="mt-1 text-xs text-muted-foreground-1">
					Kodas: {selectedVariant?.sku ?? product.sku}
				</p>

				<!-- Purchase card: variantai + likučiai + krepšelis atskirti nuo
				informacinės dalies -->
				<div class="mt-6 rounded-xl border border-layer-line bg-layer p-4 sm:p-5">
				<form
					method="POST"
					action="?/add"
					use:enhance={({ submitter }) => {
						const favAction =
							submitter instanceof HTMLButtonElement &&
							submitter.getAttribute('formaction') === '?/fav';
						const wasFav = isFav;
						if (favAction) favBusy = true;
						else addBusy = true;
						return async ({ result }) => {
							favBusy = false;
							addBusy = false;
							if (result.type === 'success') {
								if (favAction) {
									pushToast(
										wasFav ? 'Pašalinta iš mėgstamų' : 'Pridėta prie mėgstamų',
										'success'
									);
								} else {
									addedFlash = true;
									setTimeout(() => (addedFlash = false), 3000);
									pushToast('Prekė įdėta į krepšelį', 'success');
								}
								await invalidateAll();
							} else if (result.type === 'failure') {
								pushToast(
									(result.data?.addError as string) ??
										(result.data?.favError as string) ??
										'Veiksmas nepavyko',
									'error'
								);
							}
						};
					}}
				>
					{#if optionGroups.length > 0 && !selectionComplete}
						<div
							class="mt-5 rounded-lg border border-teal-200 bg-teal-100 p-4 text-sm text-teal-800 dark:border-teal-900 dark:bg-teal-500/20 dark:text-teal-400"
							role="alert"
						>
							<span class="font-bold">Pasirinkite:</span>
							{missingGroups.map((g) => g.name).join(', ')}
						</div>
					{/if}
					{#each optionGroups as group, gi (group.code)}
						<div class={gi === 0 ? 'mt-5' : 'mt-6'}>
							<div class="flex flex-wrap justify-between items-center gap-3">
								<h2 class="font-medium text-foreground">
									{group.name}
								</h2>
								{#if !groupIsColor(group)}
									<MissingFeature compact feature="Dydžių lentelė" />
								{/if}
							</div>

							{#if groupIsColor(group)}
								<!-- Color swatches -->
								<div class="mt-2 flex flex-wrap gap-3">
									{#each group.values as v (v.code)}
										{@const active = selection[group.code] === v.code}
										{@const avail = valueAvailable(group.code, v.code)}
										<button
											type="button"
											disabled={!avail}
											aria-pressed={active}
											aria-label={v.label}
											title={v.label}
											onclick={() =>
												(selection = { ...selection, [group.code]: v.code })}
											class="size-7 rounded-md flex flex-col justify-center items-center text-center {active
												? 'ring-2 ring-offset-2 ring-primary-checked'
												: ''} {avail ? '' : 'opacity-50 cursor-not-allowed'}"
										>
											<span
												class="size-7 rounded-md border border-line-2"
												style:background-color={v.code}
											></span>
										</button>
									{/each}
								</div>
								{#if selection[group.code]}
									<p class="mt-2 text-xs text-muted-foreground-1">
										{group.values.find((v) => v.code === selection[group.code])
											?.label}
									</p>
								{/if}
							{:else}
								<!-- Values grid: su nuotrauka, kai variantas ją turi -->
								{@const hasThumbs = group.values.some((v) =>
									valueThumbs.has(`${group.code}:${v.code}`)
								)}
								<div
									class="mt-2 {hasThumbs || group.values.length > 8
										? 'flex flex-wrap gap-2'
										: 'grid grid-cols-4 gap-2'}"
								>
									{#each group.values as v (v.code)}
										{@const active = selection[group.code] === v.code}
										{@const avail = valueAvailable(group.code, v.code)}
										{@const thumb = valueThumbs.get(`${group.code}:${v.code}`)}
										<button
											type="button"
											disabled={!avail}
											aria-pressed={active}
											title={v.label}
											onclick={() =>
												(selection = { ...selection, [group.code]: v.code })}
											class="relative flex items-center border rounded-lg {thumb
												? 'flex-col gap-y-1 p-2 w-20'
												: 'justify-center gap-x-3 p-2.5 text-center'} text-xs {active
												? 'border-primary-checked text-primary-checked ring-1 ring-primary-checked'
												: avail
													? 'border-layer-line text-layer-foreground hover:bg-muted-hover'
													: 'border-layer-line text-line-2 opacity-70 cursor-not-allowed after:absolute after:inset-0 after:bg-[linear-gradient(to_right_bottom,transparent_calc(50%-1px),var(--color-line-2)_calc(50%-1px),var(--color-line-2)_50%,transparent_50%)]'}"
										>
											{#if thumb}
												<img
													src={thumb}
													alt=""
													loading="lazy"
													decoding="async"
													class="size-14 rounded-md object-cover"
												/>
											{/if}
											<span
												class="block {thumb ? 'w-full truncate text-center' : ''}"
												>{v.label}</span
											>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/each}

					{#if !optionGroups.length && variants.length > 1}
						<!-- Variantų sąrašas (be option grupių): kortelės kaip
						option mygtukai, label = v.name || v.sku -->
						<div class="mt-5">
							<h2 class="font-medium text-foreground">Variantas</h2>
							<div class="mt-2 grid grid-cols-2 gap-2">
								{#each variants as v (v.sku)}
									{@const active = selectedVariant === v}
									{@const avail = v.stock_available > 0 || product.is_gift_card}
									{@const delta = (v.price?.gross ?? 0) - cheapestGross}
									<button
										type="button"
										aria-pressed={active}
										onclick={() => (selectedSku = v.sku)}
										class="p-2.5 relative flex flex-row items-center gap-x-2.5 text-left border rounded-lg {active
											? 'border-primary-checked text-primary-checked ring-1 ring-primary-checked'
											: 'border-layer-line text-layer-foreground hover:bg-muted-hover'}"
									>
										{#if v.images?.length}
											<img
												src={v.images[0].url}
												alt=""
												loading="lazy"
												decoding="async"
												class="size-10 shrink-0 rounded-md object-cover"
											/>
										{/if}
										<span class="flex min-w-0 flex-col gap-y-0.5">
											<span class="block truncate text-sm font-medium">
												{v.name || v.sku}
											</span>
											<span
												class="flex items-center gap-x-2 text-xs text-muted-foreground-1"
											>
												{#if delta > 0.005}
													<span>+{formatMoney({ currency: v.price.currency, net: delta, vat_rate: v.price.vat_rate, vat: 0, gross: delta })}</span>
												{/if}
												<span class={avail ? 'text-green-600 dark:text-green-400' : 'text-line-2'}>
													{avail ? 'Turima' : 'Nėra'}
												</span>
											</span>
										</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					{#if optionGroups.length > 0 && Object.keys(selection).length > 0}
						<div class="mt-4 text-center text-xs">
							<button
								type="button"
								class="text-muted-foreground-1 underline underline-offset-2 hover:text-foreground"
								onclick={() => (selection = {})}
							>Išvalyti pasirinkimą</button>
						</div>
					{/if}

					<!-- Stock / skaitmeninio pristatymo pastaba -->
					{#if product.is_gift_card}
						<div class="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 dark:border-blue-500/20 dark:bg-blue-500/10">
							<p class="flex items-center gap-x-1.5 text-sm font-medium text-blue-900 dark:text-blue-200">
								<MailCheck class="shrink-0 size-4" />
								Skaitmeninė dovanų kortelė
							</p>
							<ul class="mt-1.5 list-disc space-y-0.5 ps-5 text-sm text-blue-800 dark:text-blue-300">
								<li>Kodas išsiunčiamas el. paštu iškart po apmokėjimo</li>
								<li>Pristatymas nereikalingas — nieko nereikia laukti</li>
								<li>Galioja 12 mėn.; sumą galima išleisti dalimis</li>
							</ul>
						</div>
					{:else if selectionComplete}
						<div class="mt-5 space-y-1.5">
							<p class="flex items-center gap-x-1.5 text-sm">
								<Store class="shrink-0 size-4 text-foreground" />
								<span class="text-muted-foreground-1">Parduotuvėje:</span>
								{@render stockStatus(localQty)}
							</p>
							<p class="flex items-center gap-x-1.5 text-sm">
								<Warehouse class="shrink-0 size-4 text-foreground" />
								<span class="text-muted-foreground-1">Nuotolinis sandėlys:</span>
								{@render stockStatus(remoteQty)}
							</p>
							{#if etaSpan}
								<p class="flex items-center gap-x-1.5 text-sm">
									<AnimatedStopwatch class="shrink-0 size-4 text-foreground" />
									<span class="text-muted-foreground-1">Pristatymas:</span>
									<span class="text-foreground">{etaSpan}</span>
								</p>
							{/if}
						</div>
					{/if}
					<!-- End Stock -->

					<!-- Button Group -->
					<div class="mt-7 flex gap-3">
						<select
							aria-label="Kiekis"
							bind:value={
								() => qty,
								(v) => (qty = Number(v))
							}
							class="py-3 ps-4 pe-8 inline-block bg-layer border border-layer-line rounded-lg text-sm text-layer-foreground cursor-pointer hover:bg-layer-hover focus:border-primary-focus focus:outline-hidden"
						>
							{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n (n)}
								<option value={n}>{n}</option>
							{/each}
						</select>
						<input type="hidden" name="qty" value={qty} />
						{#if selectedVariant}
							<input type="hidden" name="variant_id" value={selectedVariant.id} />
							{#if selectedVariant.offer_id}
								<input
									type="hidden"
									name="offer_id"
									value={selectedVariant.offer_id}
								/>
							{/if}
						{/if}

						<button
							type="submit"
							disabled={addBusy || !selectedVariant || !selectionComplete || (!product.is_gift_card && totalQty <= 0)}
							class="py-3 px-4 w-full inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg bg-secondary border border-secondary-line text-secondary-foreground hover:bg-secondary-hover focus:outline-hidden focus:bg-secondary-focus disabled:opacity-50 disabled:pointer-events-none"
						>
							{#if addBusy}
								<span
									class="relative flex size-4 items-center justify-center"
									aria-hidden="true"
								>
									<span
										class="absolute inline-flex size-4 animate-ping rounded-full border border-current opacity-60"
									></span>
									<span
										class="inline-flex size-3.5 rounded-full border border-current"
									></span>
								</span>
								Pridedama…
							{:else if addedFlash}
								<Check class="shrink-0 size-4" /> Pridėta!
							{:else}
								<ShoppingCart class="shrink-0 size-4" /> Į krepšelį
							{/if}
						</button>

						<button
							type="submit"
							formaction="?/fav"
							disabled={!selectedVariant || favBusy}
							title={isFav ? 'Pašalinti iš mėgstamų' : 'Į mėgstamas'}
							aria-pressed={isFav}
							class="py-3 px-4 relative inline-flex justify-center items-center gap-x-1.5 text-sm font-medium rounded-lg bg-layer border border-layer-line text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<input type="hidden" name="is_fav" value={isFav ? '1' : '0'} />
							<span class="sr-only">Mėgstamiausi</span>
							{#if favBusy}
								<span
									class="relative flex size-4 items-center justify-center"
									aria-hidden="true"
								>
									<span
										class="absolute inline-flex size-4 animate-ping rounded-full border border-current opacity-60"
									></span>
									<span
										class="inline-flex size-3.5 rounded-full border border-current"
									></span>
								</span>
							{:else}
								<Heart
									class="shrink-0 size-4 transition-colors {isFav
										? 'fill-current text-destructive'
										: ''}"
								/>
							{/if}
						</button>
					</div>
					<!-- End Button Group -->

					{#if form?.addError}
						<p class="mt-2 text-sm text-destructive">{form.addError}</p>
					{/if}
				</form>
				</div>
				<!-- End Purchase card -->

				<!-- Interest Info -->
				<div class="mt-7 text-center">
					<MissingFeature
						feature="Išsimokėtinis pirkimas"
						endpoint="GET /payments/inbank/calculation (auth)"
					/>
				</div>
				<!-- End Interest Info -->

				<!-- Shipping: realūs metodai iš GET /shipping/methods -->
				<div class="mt-6">
					<h2 class="flex items-center gap-x-2 font-medium text-foreground">
						<AnimatedTrolley class="size-6 shrink-0" />
						Pristatymas
					</h2>
					{#if shippingMethods.length}
						<ul
							class="mt-3 divide-y divide-line-1 overflow-hidden rounded-xl border border-layer-line"
						>
							{#each carrierMethods as m (m.code)}
								<li class="flex items-center gap-x-3 px-4 py-3">
									<div class="min-w-0 grow">
										<p class="truncate text-sm font-medium text-foreground">
											{m.name}
										</p>
										{#if etaDw}
											<p
												class="mt-0.5 flex items-center gap-x-1 text-xs text-muted-foreground-1"
											>
												<AnimatedStopwatch class="size-3.5 shrink-0" />
												{dwText(etaDw)}
											</p>
										{/if}
									</div>
									<span class="shrink-0 text-sm font-medium text-foreground">
										{Number(m.price.gross) > 0
											? formatMoney(m.price)
											: 'Nemokamai'}
									</span>
								</li>
							{/each}
							{#each pickupMethods as m (m.code)}
								<li class="flex items-center gap-x-3 px-4 py-3">
									<AnimatedShop class="size-6 shrink-0 text-foreground" />
									<div class="min-w-0 grow">
										<p class="truncate text-sm font-medium text-foreground">
											{m.name}
										</p>
										<p
											class="mt-0.5 flex items-center gap-x-1 text-xs text-muted-foreground-1"
										>
											{#if etaDw}
												<AnimatedStopwatch class="size-3.5 shrink-0" />
												{dwText(etaDw)}
											{:else}
												Atsiimsi pats — be pristatymo įkainio
											{/if}
										</p>
									</div>
									<span class="shrink-0 text-sm font-medium text-foreground">
										{Number(m.price.gross) > 0
											? formatMoney(m.price)
											: 'Nemokamai'}
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mt-1 text-sm text-muted-foreground-1">
							Pristatymo būdus parinksite atsiskaitymo metu.
						</p>
					{/if}
				</div>
				<!-- End Shipping -->

				<!-- List -->
				<div class="mt-7 space-y-3">
					<div class="flex items-center gap-x-3">
						<ShieldCheck class="shrink-0 size-5 text-foreground" />
						<div class="grow">
							<p class="text-sm text-foreground">Saugus apmokėjimas</p>
						</div>
					</div>
					<div class="flex items-center gap-x-3">
						<Undo2 class="shrink-0 size-5 text-foreground" />
						<div class="grow">
							<p class="text-sm text-foreground">30 dienų grąžinimas</p>
						</div>
					</div>
				</div>
				<!-- End List -->
				<!-- End Product Details -->
			</div>
		</div>
		<!-- End Col -->
	</div>
	<!-- End Grid -->
</div>

{#if data.recommendations.length}
	<!-- Complete the look -->
	<div
		id="rekomendacijos"
		class="scroll-mt-20 py-10 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto"
	>
		<ProductRow products={data.recommendations} title="Derinti su" href="/katalogas" />
	</div>
	<!-- End Complete the look -->
{/if}

<!-- Atsiliepimai sąmoningai nerodomi — kol kas nėra review funkcionalumo.
Galimas variantas vėliau: Google atsiliepimų insertas. -->
