<script lang="ts">
	import { collection, query, where, orderBy, onSnapshot, getCountFromServer } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import WishlistCard from '$lib/components/WishlistCard.svelte';
	import type { Wishlist } from '$lib/types';

	let wishlists = $state<(Wishlist & { itemCount: number })[]>([]);
	let loading = $state(true);

	$effect(() => {
		const currentUser = $user;
		if (!currentUser) return;

		const q = query(
			collection(db, 'wishlists'),
			where('ownerId', '==', currentUser.uid),
			orderBy('createdAt', 'desc')
		);

		const unsub = onSnapshot(q, async (snap) => {
			const lists: (Wishlist & { itemCount: number })[] = [];
			for (const doc of snap.docs) {
				const data = doc.data();
				const itemsRef = collection(db, 'wishlists', doc.id, 'items');
				const countSnap = await getCountFromServer(itemsRef);
				lists.push({
					id: doc.id,
					...data,
					itemCount: countSnap.data().count
				} as Wishlist & { itemCount: number });
			}
			wishlists = lists;
			loading = false;
		});

		return unsub;
	});
</script>

<AuthGuard>
	<div class="space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-extrabold text-text">{$t('dashboard.title')}</h1>
			<a
				href="/wishlist/new"
				class="font-bold bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
			>
				+ {$t('dashboard.create')}
			</a>
		</div>

		{#if loading}
			<div class="flex flex-col items-center py-12 gap-3">
				<span class="text-4xl animate-float">🎁</span>
				<div class="flex gap-1.5">
					<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
					<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
					<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
				</div>
			</div>
		{:else if wishlists.length === 0}
			<div class="text-center py-16">
				<span class="text-6xl block mb-4">🌟</span>
				<p class="text-text-soft text-lg font-semibold mb-6">{$t('dashboard.empty')}</p>
				<a
					href="/wishlist/new"
					class="font-bold bg-gradient-to-r from-primary to-secondary text-white px-8 py-3.5 rounded-full text-base hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 inline-block"
				>
					✨ {$t('dashboard.create')}
				</a>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each wishlists as wishlist (wishlist.id)}
					<WishlistCard {wishlist} itemCount={wishlist.itemCount} />
				{/each}
			</div>
		{/if}
	</div>
</AuthGuard>
