<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts } from '#lib/toast';
</script>

<div
	class="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-y-2"
	aria-live="polite"
>
	{#each $toasts as t (t.id)}
		<div
			transition:fly={{ x: 24, duration: 200 }}
			class="pointer-events-auto w-full max-w-xs rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
			role="alert"
			tabindex="-1"
		>
			<div class="flex gap-x-3">
				{#if t.kind === 'success'}
					<svg
						class="mt-0.5 size-4 shrink-0 text-teal-500"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
					>
						<path
							d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
						/>
					</svg>
				{:else if t.kind === 'error'}
					<svg
						class="mt-0.5 size-4 shrink-0 text-red-500"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
					>
						<path
							d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0-.708-.708L8 8l-2.647-2.646a.5.5 0 0 0-.708-.708L8 8l2.647-2.646.708.708a.5.5 0 0 0 .708-.708L8 8.707l2.646-2.647a.5.5 0 0 0 .708-.708L8.707 8l-2.646-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"
						/>
					</svg>
				{:else}
					<svg
						class="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-500"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						fill="currentColor"
						viewBox="0 0 16 16"
					>
						<path
							d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
						/>
					</svg>
				{/if}
				<div class="grow">
					<p class="text-sm text-gray-800 dark:text-white">{t.message}</p>
				</div>
			</div>
		</div>
	{/each}
</div>
