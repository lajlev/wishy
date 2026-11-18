<script lang="ts">
	let {
		name,
		photoUrl = null,
		size = 'md'
	}: {
		name: string;
		photoUrl?: string | null;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const sizeClass = $derived(
		size === 'sm' ? 'w-10 h-10 text-base' : size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg'
	);
</script>

{#if photoUrl}
	<img
		src={photoUrl}
		alt={name}
		class="{sizeClass} flex-shrink-0 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
	/>
{:else}
	<div class="{sizeClass} flex-shrink-0 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center font-bold text-white border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors">
		{(name || '?').charAt(0).toUpperCase()}
	</div>
{/if}
