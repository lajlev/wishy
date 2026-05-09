<script lang="ts">
	import type { Snippet } from 'svelte';
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { initAuth } from '$lib/stores/auth';

	let { children }: { children: Snippet } = $props();

	initAuth();
</script>

<div class="min-h-screen flex flex-col">
	<Nav />
	<main class="flex-1 mx-auto max-w-3xl w-full px-4 py-6">
		{@render children()}
	</main>
</div>
