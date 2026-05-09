<script lang="ts">
	import type { Snippet } from 'svelte';
	import { isLoading, isLoggedIn } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		if (!$isLoading && !$isLoggedIn) {
			const redirect = page.url.pathname + page.url.search;
			goto(`/login?redirect=${encodeURIComponent(redirect)}`);
		}
	});
</script>

{#if $isLoading}
	<div class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
		<span class="text-5xl animate-float">🎁</span>
		<div class="flex gap-1.5">
			<span class="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
			<span class="w-2.5 h-2.5 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
			<span class="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
		</div>
	</div>
{:else if $isLoggedIn}
	{@render children()}
{/if}
