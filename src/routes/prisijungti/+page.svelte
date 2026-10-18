<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Loader2, MailCheck } from '@lucide/svelte';

	let email = $state('');
	let code = $state('');
	let step = $state<'request' | 'verify'>('request');
	let message = $state<string | null>(null);
	let error = $state<string | null>(null);
	let busy = $state(false);

	const nextUrl = $derived.by(() => {
		const next = page.url.searchParams.get('next');
		return next && next.startsWith('/') ? next : '/paskyra';
	});

	async function api(path: string, body: Record<string, unknown>) {
		const res = await fetch(`/api/v1${path}`, {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			body: JSON.stringify(body)
		});
		const data = await res.json().catch(() => ({}));
		if (!res.ok) throw new Error(data?.detail ?? `Klaida (${res.status})`);
		return data;
	}

	async function requestOtp(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = null;
		try {
			await api('/auth/otp/request', { email: email.trim() });
			step = 'verify';
			message = 'Išsiuntėme prisijungimo kodą į jūsų el. paštą.';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Nepavyko išsiųsti kodo.';
		} finally {
			busy = false;
		}
	}

	async function verifyOtp(e: SubmitEvent) {
		e.preventDefault();
		busy = true;
		error = null;
		try {
			await api('/auth/otp/verify', { email: email.trim(), code: code.trim() });
			await invalidateAll();
			await goto(nextUrl);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Neteisingas kodas.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>Prisijungti — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6">
	<div
		class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-neutral-700 dark:bg-neutral-900"
	>
		<h1 class="text-xl font-bold text-gray-900 dark:text-white">Prisijungti</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
			Prisijungimas vienkartiniu kodu, atsiųstu el. paštu. Slaptažodžio nereikia.
		</p>

		{#if step === 'request'}
			<form class="mt-6 space-y-4" onsubmit={requestOtp}>
				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300"
						>El. paštas</label
					>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						placeholder="vardas@pastas.lt"
						class="block w-full rounded-lg border-gray-200 px-3 py-2.5 text-sm focus:border-zvynas-500 focus:ring-zvynas-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
					/>
				</div>
				<button
					type="submit"
					disabled={busy || !email.trim()}
					class="flex w-full items-center justify-center gap-x-2 rounded-full bg-zvynas-600 px-6 py-3 text-sm font-semibold text-white hover:bg-zvynas-700 disabled:opacity-60"
				>
					{#if busy}<Loader2 class="size-4 animate-spin" />{/if}
					Gauti kodą
				</button>
			</form>
		{:else}
			<form class="mt-6 space-y-4" onsubmit={verifyOtp}>
				<div
					class="flex items-center gap-x-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-400"
				>
					<MailCheck class="size-4 shrink-0" /> {message}
				</div>
				<div>
					<label for="email2" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300"
						>El. paštas</label
					>
					<input
						id="email2"
						type="email"
						bind:value={email}
						required
						autocomplete="email"
						class="block w-full rounded-lg border-gray-200 px-3 py-2.5 text-sm focus:border-zvynas-500 focus:ring-zvynas-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
					/>
				</div>
				<div>
					<label for="code" class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-neutral-300"
						>Prisijungimo kodas</label
					>
					<input
						id="code"
						type="text"
						inputmode="numeric"
						bind:value={code}
						required
						autocomplete="one-time-code"
						placeholder="••••••"
						class="block w-full rounded-lg border-gray-200 px-3 py-2.5 text-center text-lg font-semibold tracking-[0.3em] focus:border-zvynas-500 focus:ring-zvynas-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
					/>
				</div>
				<button
					type="submit"
					disabled={busy || !code.trim()}
					class="flex w-full items-center justify-center gap-x-2 rounded-full bg-zvynas-600 px-6 py-3 text-sm font-semibold text-white hover:bg-zvynas-700 disabled:opacity-60"
				>
					{#if busy}<Loader2 class="size-4 animate-spin" />{/if}
					Prisijungti
				</button>
				<div class="flex items-center justify-between text-sm">
					<button
						type="button"
						onclick={() => {
							step = 'request';
							code = '';
							error = null;
						}}
						class="text-gray-500 underline hover:text-gray-700 dark:text-neutral-400"
						>Keisti el. paštą</button
					>
					<button
						type="button"
						onclick={async () => {
							error = null;
							try {
								await api('/auth/otp/request', { email: email.trim() });
								message = 'Kodas išsiųstas iš naujo.';
							} catch {
								error = 'Nepavyko išsiųsti kodo.';
							}
						}}
						class="text-zvynas-600 underline">Siųsti kodą iš naujo</button
					>
				</div>
			</form>
		{/if}

		{#if error}
			<p class="mt-4 rounded-lg bg-zvynas-50 px-3 py-2.5 text-sm text-zvynas-700 dark:bg-zvynas-500/10 dark:text-zvynas-400">
				{error}
			</p>
		{/if}
	</div>
</div>
