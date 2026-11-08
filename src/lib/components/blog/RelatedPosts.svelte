<script lang="ts">
	import type { BlogPostListOut } from '#lib/api/types';
	import { lh } from '#lib/i18n/instance';
	import BlogPostCard from './BlogPostCard.svelte';

	let { posts, title = 'Susiję straipsniai' }: { posts: BlogPostListOut[]; title?: string } =
		$props();
</script>

{#if posts.length}
	<section class="py-10 w-full max-w-340 px-4 sm:px-6 lg:px-8 mx-auto">
		<div class="flex items-center justify-between gap-4 mb-5">
			<h2 class="font-medium text-xl text-foreground">{title}</h2>
			<a href={lh('/patarimai')} class="text-sm text-primary hover:underline underline-offset-4">Visi patarimai</a>
		</div>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each posts as post (post.id)}
				<BlogPostCard {post} />
			{/each}
		</div>
	</section>
{/if}
