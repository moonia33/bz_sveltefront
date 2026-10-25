<script lang="ts">
	import { ArrowLeft, ChevronRight, FileText } from '@lucide/svelte';

	let { data } = $props();
	const category = $derived(data.category);
	const pages = $derived(data.pages ?? []);

	function fmtDate(iso: string): string {
		if (!iso) return '';
		return new Intl.DateTimeFormat('lt-LT', { dateStyle: 'medium' }).format(new Date(iso));
	}
</script>

<svelte:head>
	<title>{category?.name || 'Pagalba'} — Baltijos Žvynas</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
	<a
		href="/pagalba"
		class="inline-flex items-center gap-x-1 text-sm text-muted-foreground-1 hover:text-foreground"
	>
		<ArrowLeft class="size-4" /> Pagalbos centras
	</a>

	<h1 class="mt-3 text-2xl font-bold text-foreground">
		{category?.name || data.slug}
	</h1>
	{#if category?.description}
		<p class="mt-1 text-sm text-muted-foreground-1">{category.description}</p>
	{/if}

	<div class="mt-6 divide-y divide-card-line rounded-xl border border-card-line bg-card">
		{#each pages as p (p.slug)}
			<a
				href="/info/{p.slug}"
				class="flex items-center justify-between px-5 py-4 hover:bg-layer-hover"
			>
				<div class="flex items-center gap-x-3">
					<FileText class="size-4 shrink-0 text-primary" />
					<div>
						<p class="text-sm font-medium text-foreground">{p.title || p.slug}</p>
						{#if p.updated_at}
							<p class="text-xs text-muted-foreground">atnaujinta {fmtDate(p.updated_at)}</p>
						{/if}
					</div>
				</div>
				<ChevronRight class="size-4 shrink-0 text-muted-foreground-1" />
			</a>
		{:else}
			<p class="px-5 py-10 text-center text-sm text-muted-foreground-1">
				Šioje kategorijoje straipsnių dar nėra.
			</p>
		{/each}
	</div>
</div>
