<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { formatMoney } from '#lib/money';
	import {
		Check,
		Loader2,
		MailCheck,
		MapPin,
		Package,
		Store,
		Truck
	} from '@lucide/svelte';
	import type {
		AddressOut,
		CheckoutConfirmOut,
		CheckoutPreviewOut,
		ConsentDefinitionOut,
		MeOut,
		PaymentOptionOut,
		PickupPointLocation,
		ShippingMethodOut
	} from '#lib/api/types';

	let { data } = $props();

	// ---------- Bendras API helperis per /api/v1 proxy ----------
	async function api<T>(path: string, body?: Record<string, unknown>, method = 'POST') {
		const res = await fetch(`/api/v1${path}`, {
			method,
			credentials: 'include',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: body ? JSON.stringify(body) : undefined
		});
		const d = await res.json().catch(() => ({}));
		if (!res.ok) {
			const msg = typeof d?.detail === 'string' ? d.detail : `Klaida (${res.status})`;
			throw new Error(msg);
		}
		return d as T;
	}
	const getJson = <T>(path: string) =>
		fetch(`/api/v1${path}`, { credentials: 'include' }).then(async (r) => {
			const d = await r.json().catch(() => ({}));
			if (!r.ok) throw new Error(d?.detail ?? `Klaida (${r.status})`);
			return d as T;
		});

	// ---------- Kontaktas (OTP „guest" flow) ----------
	let me = $state<MeOut | null>(data.me);
	let email = $state('');
	let otpCode = $state('');
	let otpSent = $state(false);
	let firstName = $state(data.me?.first_name ?? '');
	let lastName = $state(data.me?.last_name ?? '');
	let phone = $state(
		data.me?.phones?.find((p) => p.is_primary)?.phone ?? data.me?.phones?.[0]?.phone ?? ''
	);
	let contactBusy = $state(false);
	let contactError = $state<string | null>(null);

	const profileFilled = $derived(
		Boolean(me && firstName.trim() && lastName.trim() && phone.trim())
	);

	async function requestOtp() {
		contactBusy = true;
		contactError = null;
		try {
			await api('/auth/otp/request', { email: email.trim() });
			otpSent = true;
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Nepavyko išsiųsti kodo.';
		} finally {
			contactBusy = false;
		}
	}

	async function verifyOtp() {
		contactBusy = true;
		contactError = null;
		try {
			await api('/auth/otp/verify', { email: email.trim(), code: otpCode.trim() });
			me = await getJson<MeOut>('/auth/me');
			firstName = firstName || me.first_name || '';
			lastName = lastName || me.last_name || '';
			phone = phone || me.phones?.find((p) => p.is_primary)?.phone || '';
			await invalidateAll();
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Neteisingas kodas.';
		} finally {
			contactBusy = false;
		}
	}

	async function saveProfile() {
		contactBusy = true;
		contactError = null;
		try {
			me = await api<MeOut>('/auth/me', {
				first_name: firstName.trim(),
				last_name: lastName.trim(),
				phone: phone.trim()
			}, 'PATCH');
			contactDone = true;
		} catch (e) {
			contactError = e instanceof Error ? e.message : 'Nepavyko išsaugoti duomenų.';
		} finally {
			contactBusy = false;
		}
	}

	let contactDone = $state(
		Boolean(data.me?.first_name && data.me?.last_name && phone.trim())
	);

	// ---------- Pristatymas ----------
	const methods = $derived<ShippingMethodOut[]>(data.shipping_methods ?? []);
	let shippingMethod = $state<ShippingMethodOut | null>(null);
	let shippingAddressId = $state<number | null>(null);
	let pickupPointId = $state<string | null>(null);

	// Paštomatų paieška
	let lockerQuery = $state('');
	let lockerOptions = $state<PickupPointLocation[]>([]);
	let lockerLoading = $state(false);
	let selectedLocker = $state<PickupPointLocation | null>(null);
	let lockerOpen = $state(false);
	let lockerTimer: ReturnType<typeof setTimeout> | null = null;

	const isPickupMethod = $derived(Boolean(shippingMethod?.requires_pickup_point));
	const lockerEndpoint = $derived(
		shippingMethod?.carrier_code === 'dpd' ? '/dpd/lockers' : '/unisend/terminals'
	);

	function searchLockers() {
		if (lockerTimer) clearTimeout(lockerTimer);
		lockerTimer = setTimeout(async () => {
			lockerLoading = true;
			try {
				const q = lockerQuery.trim();
				lockerOptions = await getJson<PickupPointLocation[]>(
					`${lockerEndpoint}?country_code=LT&limit=25${q ? `&search=${encodeURIComponent(q)}` : ''}`
				);
				lockerOpen = true;
			} catch {
				lockerOptions = [];
			} finally {
				lockerLoading = false;
			}
		}, 250);
	}

	let shipBusy = $state(false);
	let shipError = $state<string | null>(null);

	async function chooseLocker(loc: PickupPointLocation) {
		selectedLocker = loc;
		lockerOpen = false;
		lockerQuery = `${loc.name} — ${loc.city}, ${loc.street}`;
		shipBusy = true;
		shipError = null;
		try {
			// Locker adresas → UserAddress (mokėtojo + pristatymo vienu judesiu).
			const out = await api<{ shipping_address_id: number }>(
				'/checkout/apply-pickup-point',
				{ shipping_method: shippingMethod!.code, pickup_point_id: loc.id }
			);
			shippingAddressId = out.shipping_address_id;
			pickupPointId = loc.id;
			await refreshPreview();
		} catch (e) {
			selectedLocker = null;
			shipError = e instanceof Error ? e.message : 'Nepavyko pritaikyti paštomato.';
		} finally {
			shipBusy = false;
		}
	}

	// Adresai (kurjeris / atsiėmimas su sąskaitos adresu)
	const savedAddresses = $derived<AddressOut[]>(me?.addresses ?? []);
	let addrMode = $state<'saved' | 'new'>('saved');
	let addrSelectedId = $state<number | null>(null);
	let newAddr = $state({ full_name: '', line1: '', city: '', postal_code: '', phone: '' });

	$effect(() => {
		// Prefill naujo adreso formos kontaktiniais duomenimis.
		if (!newAddr.full_name && firstName) newAddr.full_name = `${firstName} ${lastName}`.trim();
		if (!newAddr.phone && phone) newAddr.phone = phone;
	});

	async function chooseAddress() {
		shipBusy = true;
		shipError = null;
		try {
			if (addrMode === 'saved') {
				if (!addrSelectedId) throw new Error('Pasirinkite adresą.');
				shippingAddressId = addrSelectedId;
			} else {
				const a = await api<AddressOut>('/auth/addresses', {
					...newAddr,
					country_code: 'LT',
					is_default_shipping: true
				});
				shippingAddressId = a.id;
				me = me ? { ...me, addresses: [...(me.addresses ?? []), a] } : me;
				addrMode = 'saved';
				addrSelectedId = a.id;
			}
			await refreshPreview();
		} catch (e) {
			shipError = e instanceof Error ? e.message : 'Nepavyko išsaugoti adreso.';
		} finally {
			shipBusy = false;
		}
	}

	function selectMethod(m: ShippingMethodOut) {
		if (shippingMethod?.code === m.code) return;
		shippingMethod = m;
		shippingAddressId = null;
		pickupPointId = null;
		selectedLocker = null;
		lockerQuery = '';
		lockerOptions = [];
		preview = null;
		if (m.requires_pickup_point) searchLockers();
	}

	// ---------- Preview (suvestinė) ----------
	let preview = $state<CheckoutPreviewOut | null>(null);
	let previewBusy = $state(false);
	let previewTimer: ReturnType<typeof setTimeout> | null = null;
	let couponCode = $state(data.coupon ?? '');
	let couponApplied = $state<string | null>(null);
	let couponError = $state<string | null>(null);

	async function refreshPreview() {
		if (!shippingAddressId || !shippingMethod) return;
		if (previewTimer) clearTimeout(previewTimer);
		previewTimer = setTimeout(async () => {
			previewBusy = true;
			couponError = null;
			try {
				preview = await api<CheckoutPreviewOut>('/checkout/preview', {
					shipping_address_id: shippingAddressId,
					shipping_method: shippingMethod!.code,
					pickup_point_id: pickupPointId,
					payment_method: chosenPaymentOption?.payload?.payment_method || 'bank_transfer',
					coupon_code: couponCode.trim() || null
				});
				couponApplied = couponCode.trim() || null;
			} catch (e) {
				preview = null;
				const msg = e instanceof Error ? e.message : '';
				couponError = couponCode.trim() && msg ? msg : null;
			} finally {
				previewBusy = false;
			}
		}, 300);
	}

	// ---------- Mokėjimas ----------
	let paymentOptions = $state<PaymentOptionOut[]>([]);
	let paymentOptionId = $state('');
	let payBusy = $state(false);
	let consents = $state<ConsentDefinitionOut[]>([]);
	let consentsChecked = $state(false);
	let consentsLoaded = $state(false);
	const chosenPaymentOption = $derived(
		paymentOptions.find((o) => o.id === paymentOptionId) ?? null
	);

	// Inbank kalkuliatorius — „nuo X €/mėn" pasirinktam produktui.
	let inbankPeriod = $state(24);
	let inbankCalc = $state<{ monthly_payment: number; total_cost: number } | null>(null);
	let inbankCalcBusy = $state(false);
	const _zeroMoney = { currency: 'EUR', net: 0, vat_rate: 0, vat: 0 };
	const inbankPeriods = $derived.by(() => {
		const p = chosenPaymentOption?.payload;
		if (Array.isArray(p?.allowed_periods) && p!.allowed_periods!.length) {
			return p!.allowed_periods!;
		}
		const min = Number(p?.min_period) || 6;
		const max = Math.min(Number(p?.max_period) || 60, 84);
		const out: number[] = [];
		for (let n = 6; n <= max; n += 6) if (n >= min) out.push(n);
		return out.length ? out : [12, 24, 36];
	});

	$effect(() => {
		const url = chosenPaymentOption?.payload?.calculator_url;
		const total = preview?.order_total?.gross;
		if (!url || !total) {
			inbankCalc = null;
			return;
		}
		const period = inbankPeriod;
		inbankCalcBusy = true;
		getJson<{ monthly_payment: number; total_cost: number }>(
			`${url}?amount=${total}&period=${period}`
		)
			.then((d) => (inbankCalc = d))
			.catch(() => (inbankCalc = null))
			.finally(() => (inbankCalcBusy = false));
	});

	$effect(() => {
		// Mokėjimo opcijos + consents — kai pasirinktas pristatymas.
		if (me && shippingMethod && !paymentOptions.length && !payBusy) {
			payBusy = true;
			Promise.all([
				getJson<PaymentOptionOut[]>(
					`/checkout/payment-options?country_code=LT&shipping_method=${shippingMethod.code}`
				).catch(() => []),
				consentsLoaded
					? Promise.resolve(consents)
					: getJson<ConsentDefinitionOut[]>('/checkout/consents').catch(() => [])
			])
				.then(([opts, cs]) => {
					paymentOptions = opts;
					consents = cs;
					consentsLoaded = true;
					if (!paymentOptionId && opts.length) paymentOptionId = opts[0].id;
				})
				.finally(() => (payBusy = false));
		}
	});

	// ---------- Confirm ----------
	let confirmBusy = $state(false);
	let confirmError = $state<string | null>(null);
	let confirmed = $state<CheckoutConfirmOut | null>(null);
	const idemKey = crypto.randomUUID();

	async function confirmOrder() {
		const opt = chosenPaymentOption;
		if (!shippingAddressId || !shippingMethod || !opt || !consentsChecked) return;
		confirmBusy = true;
		confirmError = null;
		try {
			const res = await fetch('/api/v1/checkout/confirm', {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'Idempotency-Key': idemKey
				},
				body: JSON.stringify({
					shipping_address_id: shippingAddressId,
					shipping_method: shippingMethod.code,
					pickup_point_id: pickupPointId,
					payment_method: opt.payload?.payment_method || 'bank_transfer',
					payment_provider: opt.payload?.preferred_provider || null,
					montonio_method: opt.payload?.montonio_method || null,
					inbank_product_code: opt.payload?.inbank_product_code || null,
					coupon_code: couponCode.trim() || null,
					consents: consents
						.filter((c) => c.required)
						.map((c) => ({ kind: c.kind, document_version: c.document_version }))
				})
			});
			const d = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(d?.detail ?? `Klaida (${res.status})`);
			confirmed = d as CheckoutConfirmOut;
			await invalidateAll();
			if (confirmed.redirect_url) {
				window.location.href = confirmed.redirect_url;
			} else {
				await goto(`/uzsakymas?order=${confirmed.order_id}`);
			}
		} catch (e) {
			confirmError = e instanceof Error ? e.message : 'Nepavyko patvirtinti užsakymo.';
		} finally {
			confirmBusy = false;
		}
	}

	const step = $derived(
		!me ? 1 : !contactDone ? 1 : !shippingAddressId ? 2 : 3
	);
	const canConfirm = $derived(
		Boolean(shippingAddressId && shippingMethod && paymentOptionId && consentsChecked && !confirmBusy)
	);
</script>

<svelte:head>
	<title>Atsiskaitymas — Baltijos Žvynas</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<h1 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Atsiskaitymas</h1>

	{#if confirmed}
		<!-- Redirect'inama į /uzsakymas -->
		<p class="text-sm text-gray-500">Nukreipiama…</p>
	{:else}
		<div class="grid grid-cols-1 gap-10 lg:grid-cols-5">
			<!-- Žingsniai -->
			<div class="space-y-8 lg:col-span-3">
				<!-- 1. Kontaktas -->
				<section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
					<h2 class="flex items-center gap-x-2 text-base font-semibold text-gray-900 dark:text-white">
						<span class="flex size-6 items-center justify-center rounded-full {me && contactDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} text-xs font-bold">
							{#if me && contactDone}<Check class="size-3.5" />{:else}1{/if}
						</span>
						Kontaktas
						{#if me && contactDone}
							<button type="button" onclick={() => (contactDone = false)} class="ms-auto text-xs font-normal text-gray-400 underline">Keisti</button>
						{/if}
					</h2>

					{#if !me}
						<!-- OTP — atrodo kaip guest, be slaptažodžio -->
						<div class="mt-4">
							{#if !otpSent}
								<div class="flex gap-2">
									<input
										type="email"
										bind:value={email}
										required
										autocomplete="email"
										placeholder="El. paštas"
										class="min-w-0 grow rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800"
									/>
									<button
										type="button"
										onclick={requestOtp}
										disabled={contactBusy || !email.trim()}
										class="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
									>
										{#if contactBusy}<Loader2 class="size-4 animate-spin" />{:else}Tęsti{/if}
									</button>
								</div>
								<p class="mt-2 text-xs text-gray-400">
									Atsiųsime vienkartinį kodą el. paštu — slaptažodžio nereikia.
								</p>
							{:else}
								<div class="flex items-center gap-x-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-400">
									<MailCheck class="size-4 shrink-0" /> Kodas išsiųstas į {email}
								</div>
								<div class="mt-3 flex gap-2">
									<input
										type="text"
										inputmode="numeric"
										bind:value={otpCode}
										autocomplete="one-time-code"
										placeholder="••••••"
										class="w-36 rounded-lg border border-gray-200 px-3 py-2.5 text-center text-lg font-semibold tracking-[0.3em] dark:border-neutral-700 dark:bg-neutral-800"
									/>
									<button
										type="button"
										onclick={verifyOtp}
										disabled={contactBusy || !otpCode.trim()}
										class="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
									>
										{#if contactBusy}<Loader2 class="size-4 animate-spin" />{:else}Patvirtinti{/if}
									</button>
								</div>
								<div class="mt-2 flex gap-4 text-xs">
									<button type="button" onclick={() => { otpSent = false; otpCode = ''; }} class="text-gray-500 underline">Keisti el. paštą</button>
									<button type="button" onclick={requestOtp} class="text-primary underline">Siųsti iš naujo</button>
								</div>
							{/if}
						</div>
					{:else if !contactDone}
						<div class="mt-4 space-y-3">
							<p class="text-sm text-gray-500 dark:text-neutral-400">{me.email}</p>
							<div class="grid grid-cols-2 gap-3">
								<input type="text" bind:value={firstName} placeholder="Vardas" required autocomplete="given-name" class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
								<input type="text" bind:value={lastName} placeholder="Pavardė" required autocomplete="family-name" class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
							</div>
							<input type="tel" bind:value={phone} placeholder="Telefonas (+370...)" required autocomplete="tel" class="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
							<p class="text-xs text-gray-400">Vardo ir telefono užtenka — paštomato atveju adreso neprireiks.</p>
							<button
								type="button"
								onclick={saveProfile}
								disabled={contactBusy || !profileFilled}
								class="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
							>
								{#if contactBusy}<Loader2 class="size-4 animate-spin" />{:else}Tęsti{/if}
							</button>
						</div>
					{:else}
						<p class="mt-3 text-sm text-gray-600 dark:text-neutral-300">
							{firstName} {lastName} · {me.email} · {phone}
						</p>
					{/if}
					{#if contactError}
						<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{contactError}</p>
					{/if}
				</section>

				<!-- 2. Pristatymas -->
				<section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900 {step < 2 ? 'opacity-50' : ''}">
					<h2 class="flex items-center gap-x-2 text-base font-semibold text-gray-900 dark:text-white">
						<span class="flex size-6 items-center justify-center rounded-full {shippingAddressId ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} text-xs font-bold">
							{#if shippingAddressId}<Check class="size-3.5" />{:else}2{/if}
						</span>
						Pristatymas
					</h2>

					{#if step >= 2}
						<div class="mt-4 space-y-2">
							{#each methods as m (m.code)}
								{@const active = shippingMethod?.code === m.code}
								<button
									type="button"
									onclick={() => selectMethod(m)}
									class="flex w-full items-center gap-x-3 rounded-xl border p-3 text-left transition {active ? 'border-primary bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-neutral-700'}"
								>
									{#if m.code === 'store_pickup'}
										<Store class="size-5 shrink-0 text-gray-500" />
									{:else if m.requires_pickup_point}
										<Package class="size-5 shrink-0 text-gray-500" />
									{:else}
										<Truck class="size-5 shrink-0 text-gray-500" />
									{/if}
									<span class="grow text-sm font-medium text-gray-900 dark:text-white">{m.name}</span>
									<span class="text-sm font-semibold text-gray-900 dark:text-white">
										{m.price?.gross > 0 ? formatMoney(m.price) : 'Nemokamai'}
									</span>
								</button>
							{/each}
						</div>

						{#if shippingMethod && isPickupMethod}
							<!-- Paštomato pasirinkimas — adresas užpildomas automatiškai -->
							<div class="relative mt-4">
								<div class="relative">
									<MapPin class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
									<input
										type="text"
										bind:value={lockerQuery}
										oninput={searchLockers}
										onfocus={() => lockerOptions.length && (lockerOpen = true)}
										placeholder="Ieškoti paštomato (miestas, pavadinimas)…"
										class="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-800"
									/>
									{#if lockerLoading}
										<Loader2 class="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-400" />
									{/if}
								</div>
								{#if lockerOpen && lockerOptions.length}
									<ul class="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
										{#each lockerOptions as loc (loc.id)}
											<li>
												<button
													type="button"
													onclick={() => chooseLocker(loc)}
													class="flex w-full flex-col px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-neutral-800"
												>
													<span class="text-sm font-medium text-gray-900 dark:text-white">{loc.name}</span>
													<span class="text-xs text-gray-500">{loc.city}, {loc.street} {loc.postalCode}</span>
												</button>
											</li>
										{/each}
									</ul>
								{/if}
								{#if selectedLocker && shippingAddressId}
									<div class="mt-3 flex items-start gap-x-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-400">
										<Check class="mt-0.5 size-4 shrink-0" />
										<span>
											<strong>{selectedLocker.name}</strong> — {selectedLocker.city}, {selectedLocker.street} {selectedLocker.postalCode}
											<span class="block text-xs">Adresas ir sąskaitos duomenys užpildyti automatiškai.</span>
										</span>
									</div>
								{/if}
							</div>
						{:else if shippingMethod}
							<!-- Kurjeris / atsiėmimas parduotuvėje — adreso pasirinkimas -->
							<div class="mt-4">
								{#if shippingMethod.code === 'store_pickup'}
									<p class="mb-3 text-xs text-gray-500 dark:text-neutral-400">
										Prekes atsiimsite parduotuvėje — žemiau nurodykite tik sąskaitos duomenis.
									</p>
								{/if}
								{#if savedAddresses.length && addrMode === 'saved'}
									<div class="space-y-2">
										{#each savedAddresses as a (a.id)}
											<label class="flex cursor-pointer items-start gap-x-3 rounded-xl border p-3 {addrSelectedId === a.id ? 'border-primary bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-neutral-700'}">
												<input type="radio" name="addr" value={a.id} bind:group={addrSelectedId} class="mt-1" />
												<span class="text-sm">
													<span class="font-medium text-gray-900 dark:text-white">{a.full_name}</span>
													{#if a.label}<span class="text-xs text-gray-400"> ({a.label})</span>{/if}
													<span class="block text-gray-500">{a.line1}, {a.city} {a.postal_code}</span>
												</span>
											</label>
										{/each}
										<button type="button" onclick={() => (addrMode = 'new')} class="text-xs text-primary underline">+ Naujas adresas</button>
									</div>
								{:else}
									<div class="grid grid-cols-2 gap-3">
										<input type="text" bind:value={newAddr.full_name} placeholder="Vardas, pavardė" class="col-span-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
										<input type="text" bind:value={newAddr.line1} placeholder="Gatvė, namo/ buto nr." autocomplete="street-address" class="col-span-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
										<input type="text" bind:value={newAddr.city} placeholder="Miestas" autocomplete="address-level2" class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
										<input type="text" bind:value={newAddr.postal_code} placeholder="Pašto kodas" autocomplete="postal-code" class="rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
										<input type="tel" bind:value={newAddr.phone} placeholder="Telefonas" class="col-span-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-800" />
									</div>
									{#if savedAddresses.length}
										<button type="button" onclick={() => (addrMode = 'saved')} class="mt-2 text-xs text-primary underline">← Išsaugoti adresai</button>
									{/if}
								{/if}
								<button
									type="button"
									onclick={chooseAddress}
									disabled={shipBusy || (addrMode === 'saved' && !addrSelectedId) || (addrMode === 'new' && (!newAddr.full_name || !newAddr.line1 || !newAddr.city || !newAddr.postal_code))}
									class="mt-3 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
								>
									{#if shipBusy}<Loader2 class="size-4 animate-spin" />{:else}Tęsti{/if}
								</button>
							</div>
						{/if}
						{#if shipError}
							<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{shipError}</p>
						{/if}
					{/if}
				</section>

				<!-- 3. Apmokėjimas -->
				<section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900 {step < 3 ? 'opacity-50' : ''}">
					<h2 class="flex items-center gap-x-2 text-base font-semibold text-gray-900 dark:text-white">
						<span class="flex size-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">3</span>
						Apmokėjimas
					</h2>

					{#if step >= 3}
						<div class="mt-4 space-y-2">
							{#each paymentOptions as opt (opt.id)}
								<label class="flex cursor-pointer items-center gap-x-3 rounded-xl border p-3 {paymentOptionId === opt.id ? 'border-primary bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-neutral-700'}">
									<input type="radio" name="pm" value={opt.id} bind:group={paymentOptionId} onchange={() => refreshPreview()} />
									{#if opt.logo_url}
										<img src={opt.logo_url} alt="" class="h-6 w-auto shrink-0" loading="lazy" />
									{/if}
									<span class="grow text-sm font-medium text-gray-900 dark:text-white">{opt.title}</span>
								</label>
							{/each}
							{#if !paymentOptions.length && !payBusy}
								<p class="text-sm text-gray-400">Mokėjimo būdų nerasta.</p>
							{/if}

							{#if chosenPaymentOption?.payload?.calculator_url}
								<div class="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
									<div class="flex items-center gap-x-3">
										<label for="inbank-period" class="text-sm text-gray-600 dark:text-neutral-300">Terminas</label>
										<select
											id="inbank-period"
											bind:value={inbankPeriod}
											class="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-900"
										>
											{#each inbankPeriods as n (n)}
												<option value={n}>{n} mėn.</option>
											{/each}
										</select>
										{#if inbankCalcBusy}
											<Loader2 class="size-4 animate-spin text-gray-400" />
										{/if}
									</div>
									{#if inbankCalc}
										<p class="mt-2 text-sm text-gray-900 dark:text-white">
											<span class="font-semibold">{formatMoney({ ..._zeroMoney, gross: inbankCalc.monthly_payment })}/mėn.</span>
											{#if inbankCalc.total_cost}
												<span class="ml-2 text-xs text-gray-500">viso {formatMoney({ ..._zeroMoney, gross: inbankCalc.total_cost })}</span>
											{/if}
										</p>
									{/if}
								</div>
							{/if}
						</div>

						<label class="mt-4 flex cursor-pointer items-start gap-x-2 text-sm text-gray-600 dark:text-neutral-300">
							<input type="checkbox" bind:checked={consentsChecked} class="mt-0.5" />
							<span>
								Sutinku su
								{#each consents.filter((c) => c.required) as c, i}
									<a href={c.url || '#'} target="_blank" rel="noopener" class="text-primary underline">{c.name}</a>{i < consents.filter((c) => c.required).length - 1 ? ' ir ' : ''}
								{/each}
							</span>
						</label>

						<button
							type="button"
							onclick={confirmOrder}
							disabled={!canConfirm}
							class="mt-4 w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
						>
							{#if confirmBusy}
								<Loader2 class="mx-auto size-4 animate-spin" />
							{:else}
								Patvirtinti užsakymą
							{/if}
						</button>
						{#if confirmError}
							<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">{confirmError}</p>
						{/if}
					{/if}
				</section>
			</div>

			<!-- Suvestinė -->
			<aside class="h-fit rounded-xl border border-gray-200 bg-gray-50 p-6 lg:col-span-2 dark:border-neutral-700 dark:bg-neutral-900">
				<h2 class="text-base font-semibold text-gray-900 dark:text-white">Užsakymo suvestinė</h2>

				<ul class="mt-4 space-y-4">
					{#each (preview?.items ?? data.cart?.items ?? []) as item (item.id)}
						<li class="flex gap-x-3">
							{#if item.image}
								<img src={item.image.url} alt={item.name} class="size-14 rounded-lg bg-white object-cover" />
							{/if}
							<div class="min-w-0 grow">
								<p class="text-sm text-gray-900 dark:text-white">{item.name}</p>
								{#if item.variant_name && item.variant_name !== item.name}
									<p class="text-xs text-gray-500">{item.variant_name}</p>
								{/if}
								<p class="text-xs text-gray-400">{item.qty} × {formatMoney(item.unit_price)}</p>
							</div>
							<span class="text-sm font-medium text-gray-900 dark:text-white">{formatMoney(item.line_total)}</span>
						</li>
					{/each}
				</ul>

				<!-- Nuolaidos kodas -->
				<div class="mt-5 flex gap-2">
					<input
						type="text"
						bind:value={couponCode}
						placeholder="Nuolaidos kodas"
						class="min-w-0 grow rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
					/>
					<button
						type="button"
						onclick={refreshPreview}
						disabled={previewBusy || !shippingAddressId}
						class="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-white disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-200"
						>Pritaikyti</button
					>
				</div>
				{#if couponError}
					<p class="mt-1.5 text-xs text-red-600">{couponError}</p>
				{:else if couponApplied && preview?.discount_total && preview.discount_total.gross > 0}
					<p class="mt-1.5 text-xs text-green-600">Kodas „{couponApplied}” pritaikytas.</p>
				{/if}

				<dl class="mt-5 space-y-2.5 border-t border-gray-200 pt-4 text-sm dark:border-neutral-700">
					<div class="flex justify-between">
						<dt class="text-gray-500 dark:text-neutral-400">Prekės</dt>
						<dd class="font-medium text-gray-900 dark:text-white">
							{formatMoney(preview?.items_total ?? data.cart?.items_total)}
						</dd>
					</div>
					<div class="flex justify-between">
						<dt class="text-gray-500 dark:text-neutral-400">Pristatymas</dt>
						<dd class="font-medium text-gray-900 dark:text-white">
							{#if preview}
								{preview.shipping_total.gross > 0 ? formatMoney(preview.shipping_total) : 'Nemokamai'}
							{:else if shippingMethod}
								{shippingMethod.price?.gross > 0 ? formatMoney(shippingMethod.price) : 'Nemokamai'}
							{:else}
								—
							{/if}
						</dd>
					</div>
					{#if preview?.discount_total && preview.discount_total.gross > 0}
						<div class="flex justify-between text-green-600">
							<dt>Nuolaida</dt>
							<dd>−{formatMoney(preview.discount_total)}</dd>
						</div>
					{/if}
					{#each preview?.fees ?? [] as f (f.code)}
						<div class="flex justify-between">
							<dt class="text-gray-500 dark:text-neutral-400">{f.name}</dt>
							<dd class="font-medium text-gray-900 dark:text-white">{formatMoney(f.amount)}</dd>
						</div>
					{/each}
					<div class="flex justify-between border-t border-gray-200 pt-2.5 dark:border-neutral-700">
						<dt class="font-semibold text-gray-900 dark:text-white">Iš viso</dt>
						<dd class="text-lg font-bold text-gray-900 dark:text-white">
							{formatMoney(preview?.order_total ?? data.cart?.items_total)}
						</dd>
					</div>
				</dl>
				{#if previewBusy}
					<p class="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
						<Loader2 class="size-3 animate-spin" /> Perskaičiuojama…
					</p>
				{/if}
			</aside>
		</div>
	{/if}
</div>
