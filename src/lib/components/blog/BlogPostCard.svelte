<script lang="ts">
	import type { BlogPostListOut } from '#lib/api/types';
	import { lh } from '#lib/i18n/instance';
	import { fmtBlogDate } from './date';

	let { post, base = '/patarimai' }: { post: BlogPostListOut; base?: string } = $props();
	const href = $derived(lh(`${base}/${post.slug}`));
</script>

<article class="group flex flex-col">
	<a {href} class="block overflow-hidden rounded-xl bg-surface aspect-16/10">
		{#if post.cover_image}
			<img
				src={post.cover_image}
				alt={post.cover_image_alt || post.title}
				loading="lazy"
				decoding="async"
				class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
			/>
		{/if}
	</a>
	<div class="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground-1">
		{#if post.published_at}<time datetime={post.published_at}>{fmtBlogDate(post.published_at)}</time>{/if}
		{#if post.reading_minutes}<span>· {post.reading_minutes} min.</span>{/if}
		{#each post.categories as c (c.slug)}<span>· {c.name}</span>{/each}
	</div>
	<h3 class="mt-1 font-medium text-foreground">
		<a {href} class="hover:underline underline-offset-4">{post.title}</a>
	</h3>
	{#if post.excerpt}
		<p class="mt-1 text-sm text-muted-foreground-1 line-clamp-3">{post.excerpt}</p>
	{/if}
</article>
