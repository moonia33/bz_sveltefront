<script lang="ts">
	import type { BadgeOut } from '#lib/api/types';

	let { badges = [], class: klass = '' }: { badges?: BadgeOut[]; class?: string } = $props();

	const styles: Record<string, string> = {
		primary: 'bg-primary-100 text-primary-800 dark:bg-primary-600 dark:text-white',
		success: 'bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-white',
		warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-white',
		danger: 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-white',
		info: 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white',
		dark: 'bg-gray-800 text-white dark:bg-white dark:text-gray-800'
	};
	const safeColor = (c: string) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : '');
</script>

{#each badges as badge (badge.code)}
	<p class={klass}>
		<span
			class="py-0.5 px-2 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-full {safeColor(
				badge.color
			)
				? 'text-white'
				: (styles[badge.style] ?? styles.primary)}"
			style={safeColor(badge.color) ? `background-color: ${badge.color}` : undefined}
		>
			{badge.name}
		</span>
	</p>
{/each}
