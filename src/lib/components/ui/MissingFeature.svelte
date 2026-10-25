<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';

	let {
		feature,
		endpoint,
		compact = false
	}: {
		feature: string;
		endpoint?: string;
		compact?: boolean;
	} = $props();

	const text = $derived(`Trūksta BE: ${feature}${endpoint ? ` · ${endpoint}` : ''}`);
</script>

{#if compact}
	<span
		class="inline-flex size-5 items-center justify-center rounded-full border border-dashed border-line-3 text-muted-foreground-1"
		title={text}
	>
		<TriangleAlert class="size-3" />
		<span class="sr-only">{text}</span>
	</span>
{:else}
	<span
		class="inline-flex items-center gap-x-1.5 rounded-lg border border-dashed border-line-3 px-2 py-1 text-xs text-muted-foreground-1"
		title={text}
	>
		<TriangleAlert class="size-3.5 shrink-0" />
		{text}
	</span>
{/if}
