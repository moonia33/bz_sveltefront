<script lang="ts">
	import {
		CalendarClock,
		CircleCheck,
		FileText,
		Package,
		Truck,
		Undo2,
		Wallet
	} from '@lucide/svelte';
	import MissingFeature from '#lib/components/ui/MissingFeature.svelte';
</script>

<svelte:head>
	<title>Keitimas ir grąžinimas — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
	<h1 class="flex items-center gap-x-2 text-2xl font-bold text-foreground">
		<Undo2 class="size-6" /> Keitimas ir grąžinimas
	</h1>
	<p class="mt-1 text-sm text-muted-foreground-1">
		Kaip grąžinti arba pakeisti prekes — taisyklės, terminai ir eiga.
	</p>

	<!-- Eiga -->
	<div class="mt-8">
		<h2 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground-1">
			Kaip tai veikia
		</h2>
		<ol class="mt-4 space-y-4">
			{#each [
				{
					icon: FileText,
					title: 'Pateikite prašymą',
					desc: 'Paskyroje → „Grąžinimai" → „Naujas grąžinimas" arba tiesiogiai iš užsakymo puslapio. Pažymėkite prekes ir priežastis.'
				},
				{
					icon: CircleCheck,
					title: 'Palaukite patvirtinimo',
					desc: 'Prašymą peržiūrime ir patvirtiname — gausite pakavimo ir išsiuntimo instrukcijas el. paštu.'
				},
				{
					icon: Truck,
					title: 'Išsiųskite prekes',
					desc: 'Prekės siunčiamos atgal nurodytu būdu; siuntos numeris matomas grąžinimo puslapyje.'
				},
				{
					icon: Package,
					title: 'Prekių patikra',
					desc: 'Gavę prekes jas patikriname ir atnaujiname RMA būseną.'
				},
				{
					icon: Wallet,
					title: 'Kreditinė ir pinigų grąžinimas',
					desc: 'Išrašoma kreditinė sąskaita, pinigai grąžinami tuo pačiu mokėjimo būdu.'
				}
			] as step, i}
				<li class="flex items-start gap-x-4">
					<span
						class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"
					>
						<step.icon class="size-4 text-primary" />
					</span>
					<div>
						<p class="text-sm font-semibold text-foreground">
							{i + 1}. {step.title}
						</p>
						<p class="mt-0.5 text-sm text-muted-foreground-1">{step.desc}</p>
					</div>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Taisyklės -->
	<div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
		<div class="rounded-xl border border-card-line bg-card p-5">
			<h3 class="flex items-center gap-x-2 font-semibold text-foreground">
				<CalendarClock class="size-4 text-primary" /> Terminai
			</h3>
			<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground-1">
				<li>Standartinis grąžinimo langas — 14 d. nuo pristatymo.</li>
				<li>
					Atskirų prekių langai gali skirtis — tikslią trukmę rasite užsakymo
					puslapyje prie kiekvienos eilutės.
				</li>
				<li>Langui pasibaigus grąžinimas galimas tik susitarus atskirai.</li>
			</ul>
		</div>
		<div class="rounded-xl border border-card-line bg-card p-5">
			<h3 class="flex items-center gap-x-2 font-semibold text-foreground">
				<Package class="size-4 text-primary" /> Sąlygos
			</h3>
			<ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground-1">
				<li>Prekės turi būti nenaudotos, originalioje pakuotėje.</li>
				<li>
					Prekės, pažymėtos „negrąžinama" (pvz., individualiai užsakytos,
					pažeistos pakuotės prekės) negrąžinamos.
				</li>
				<li>
					Mainai (keitimas į kitą dydį/variantą) vykdomi kaip grąžinimas +
					naujas užsakymas — automatinis keitimas dar neįgyvendintas.
				</li>
			</ul>
		</div>
	</div>

	<!-- CTA -->
	<div class="mt-8 flex flex-wrap items-center gap-3">
		<a
			href="/paskyra/grazinimai/naujas"
			class="inline-flex items-center gap-x-1.5 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
		>
			<Undo2 class="size-4" /> Inicijuoti grąžinimą
		</a>
		<a
			href="/paskyra/grazinimai"
			class="inline-flex items-center rounded-lg border border-layer-line px-5 py-3 text-sm font-medium text-foreground hover:bg-layer-hover"
		>
			Mano grąžinimai
		</a>
		<MissingFeature
			feature="Automatinis prekių keitimas (exchange) — šiuo metu grąžinimas + naujas užsakymas"
		/>
	</div>
</div>
