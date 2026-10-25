<script lang="ts">
	import { Clock, Mail, MapPin, Package, Phone, Store } from '@lucide/svelte';

	let { data } = $props();
	const stores = $derived(data.stores ?? []);

	const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	const dayLabels: Record<string, string> = {
		mon: 'Pr',
		tue: 'An',
		wed: 'Tr',
		thu: 'Kt',
		fri: 'Pn',
		sat: 'Št',
		sun: 'Sk'
	};

	function hoursLine(hours: Record<string, string>): string {
		return dayKeys
			.map((d) => (hours?.[d] ? `${dayLabels[d]} ${hours[d]}` : null))
			.filter(Boolean)
			.join(' · ');
	}
</script>

<svelte:head>
	<title>Mūsų parduotuvės — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
	<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
		<Store class="size-6" /> Mūsų parduotuvės
	</h1>
	<p class="mt-1 text-sm text-muted-foreground-1">
		Fizinės parduotuvės ir užsakymų atsiėmimo vietos.
	</p>

	<div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
		{#each stores as s (s.id)}
			<div class="rounded-xl border border-card-line bg-card p-5">
				<div class="flex items-start justify-between gap-2">
					<h2 class="font-semibold text-foreground">{s.name}</h2>
					{#if s.is_pickup_point}
						<span
							class="inline-flex items-center gap-x-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
						>
							<Package class="size-3" /> Atsiėmimo punktas
						</span>
					{/if}
				</div>
				<div class="mt-3 space-y-2 text-sm text-muted-foreground-1">
					<p class="flex items-start gap-x-2">
						<MapPin class="mt-0.5 size-4 shrink-0" />
						<span>{s.line1}, {s.city} {s.postal_code}, {s.country_code}</span>
					</p>
					{#if s.phone}
						<p class="flex items-center gap-x-2">
							<Phone class="size-4 shrink-0" />
							<a href="tel:{s.phone}" class="hover:text-foreground">{s.phone}</a>
						</p>
					{/if}
					{#if s.email}
						<p class="flex items-center gap-x-2">
							<Mail class="size-4 shrink-0" />
							<a href="mailto:{s.email}" class="hover:text-foreground">{s.email}</a>
						</p>
					{/if}
					{#if hoursLine(s.opening_hours)}
						<p class="flex items-start gap-x-2">
							<Clock class="mt-0.5 size-4 shrink-0" />
							<span>{hoursLine(s.opening_hours)}</span>
						</p>
					{/if}
					{#if s.description}
						<p class="pt-1 text-sm">{s.description}</p>
					{/if}
				</div>
			</div>
		{:else}
			<div
				class="col-span-full rounded-xl border border-dashed border-layer-line py-16 text-center"
			>
				<Store class="mx-auto size-10 text-muted-foreground" />
				<p class="mt-3 text-sm text-muted-foreground-1">
					Parduotuvių informacija dar nepaskelbta.
				</p>
			</div>
		{/each}
	</div>
</div>
