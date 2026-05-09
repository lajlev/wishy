<script lang="ts">
	import { t } from '$lib/i18n';
	import type { Wishlist } from '$lib/types';

	let { wishlist, itemCount = 0 }: { wishlist: Wishlist; itemCount?: number } = $props();

	const emojis = ['🎁', '🎀', '✨', '🎉', '💝', '🌟', '🧸', '🎈'];
	const emoji = $derived(emojis[Math.abs(hashCode(wishlist.id)) % emojis.length]);

	function hashCode(s: string): number {
		let h = 0;
		for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
		return h;
	}
</script>

<a
	href="/wishlist/{wishlist.id}"
	class="group block bg-card rounded-2xl border-2 border-primary-light/30 p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
>
	<div class="flex items-start gap-3">
		<span class="text-2xl group-hover:animate-wiggle">{emoji}</span>
		<div class="flex-1 min-w-0">
			<h3 class="font-bold text-text text-lg">{wishlist.title}</h3>
			{#if wishlist.description}
				<p class="text-sm text-text-soft mt-1">{wishlist.description}</p>
			{/if}
			<p class="text-xs text-text-muted mt-2 font-semibold">
				{$t('dashboard.items', { count: String(itemCount) })}
			</p>
		</div>
	</div>
</a>
