<script lang="ts">
	import type { CategoryImageOut } from '#lib/api/types';

	let {
		image = null,
		src = '',
		alt,
		width,
		height,
		sizes,
		eager = false,
		priority = false,
		class: cls = ''
	}: {
		/** BE AVIF/WebP rendition'os; be jų rodomas `src`. */
		image?: CategoryImageOut | null;
		src?: string;
		alt: string;
		width: number;
		height: number;
		sizes: string;
		eager?: boolean;
		priority?: boolean;
		class?: string;
	} = $props();

	const srcset = (s: { url: string; width: number }[]) =>
		s.map((x) => `${x.url} ${x.width}w`).join(', ');
	const url = $derived(image?.url || src);
</script>

{#if image?.webp_srcset?.length}
	<picture>
		{#if image.avif_srcset?.length}<source srcset={srcset(image.avif_srcset)} {sizes} type="image/avif" />{/if}
		<source srcset={srcset(image.webp_srcset)} {sizes} type="image/webp" />
		<img
			src={url}
			{alt}
			{width}
			{height}
			loading={eager || priority ? 'eager' : 'lazy'}
			fetchpriority={priority ? 'high' : 'auto'}
			decoding="async"
			class={cls}
		/>
	</picture>
{:else if url}
	<img
		src={url}
		{alt}
		{width}
		{height}
		loading={eager || priority ? 'eager' : 'lazy'}
		fetchpriority={priority ? 'high' : 'auto'}
		decoding="async"
		class={cls}
	/>
{/if}
