<script lang="ts">
	import {
		collection, query, where, getDocs, onSnapshot, orderBy,
		doc, setDoc, deleteDoc, serverTimestamp
	} from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { user, isLoggedIn } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';
	import WishItem from '$lib/components/WishItem.svelte';
	import type { Wishlist, WishItem as WishItemType, Reservation } from '$lib/types';

	let wishlist = $state<Wishlist | null>(null);
	let ownerName = $state('');
	let items = $state<WishItemType[]>([]);
	let reservations = $state<Record<string, Reservation>>({});
	let loading = $state(true);
	let isOwner = $state(false);

	const token = $derived(page.params.token);

	$effect(() => {
		if (!token) return;

		let unsubs: (() => void)[] = [];

		(async () => {
			const q = query(collection(db, 'wishlists'), where('shareToken', '==', token));
			const snap = await getDocs(q);

			if (snap.empty) {
				loading = false;
				return;
			}

			const wDoc = snap.docs[0];
			const data = wDoc.data();
			wishlist = { id: wDoc.id, ...data } as Wishlist;
			ownerName = (data as any).ownerName || '';

			const currentUser = $user;
			isOwner = !!(currentUser && wishlist.ownerId === currentUser.uid);

			const itemsQuery = query(
				collection(db, 'wishlists', wDoc.id, 'items'),
				orderBy('order', 'asc')
			);
			unsubs.push(
				onSnapshot(itemsQuery, (itemSnap) => {
					items = itemSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as WishItemType);
				})
			);

			if (currentUser && !isOwner) {
				unsubs.push(
					onSnapshot(collection(db, 'wishlists', wDoc.id, 'reservations'), (resSnap) => {
						const res: Record<string, Reservation> = {};
						for (const d of resSnap.docs) {
							res[d.id] = d.data() as Reservation;
						}
						reservations = res;
					})
				);
			}

			loading = false;
		})();

		return () => unsubs.forEach((u) => u());
	});

	async function reserve(itemId: string) {
		const currentUser = $user;
		if (!currentUser || !wishlist) return;

		await setDoc(doc(db, 'wishlists', wishlist.id, 'reservations', itemId), {
			reservedBy: currentUser.uid,
			reservedByName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
			reservedAt: serverTimestamp()
		});
	}

	async function unreserve(itemId: string) {
		if (!wishlist) return;
		await deleteDoc(doc(db, 'wishlists', wishlist.id, 'reservations', itemId));
	}
</script>

{#if loading}
	<div class="flex flex-col items-center py-12 gap-3">
		<span class="text-4xl animate-float">🎁</span>
		<div class="flex gap-1.5">
			<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
			<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
			<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
		</div>
	</div>
{:else if !wishlist}
	<div class="text-center py-16">
		<span class="text-5xl block mb-3">🤷</span>
		<p class="text-text-soft font-semibold">{$t('shared.notFound')}</p>
	</div>
{:else}
	<div class="space-y-6">
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm">
			<h1 class="text-2xl font-extrabold text-text">
				🎁 {$t('shared.title', { name: ownerName })}
			</h1>
			<p class="text-lg text-text-soft font-semibold mt-1">{wishlist.title}</p>
			{#if wishlist.description}
				<p class="text-text-muted mt-1">{wishlist.description}</p>
			{/if}
		</div>

		{#if isOwner}
			<div class="bg-accent-light/40 border-2 border-accent/30 rounded-2xl p-4">
				<p class="text-sm font-semibold text-text-soft">👀 {$t('shared.ownList')}</p>
			</div>
		{/if}

		{#if !$isLoggedIn}
			<div class="bg-primary-light/20 border-2 border-primary-light/40 rounded-2xl p-4 text-center">
				<a
					href="/login?redirect={encodeURIComponent(`/shared/${token}`)}"
					class="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
				>
					✨ {$t('shared.loginToReserve')}
				</a>
			</div>
		{/if}

		<div class="space-y-3">
			{#each items as item (item.id)}
				<WishItem
					{item}
					reservation={reservations[item.id] || null}
					isShared={true}
					isOwner={isOwner}
					currentUserId={$user?.uid || ''}
					onreserve={() => reserve(item.id)}
					onunreserve={() => unreserve(item.id)}
				/>
			{/each}
		</div>

		{#if items.length === 0}
			<div class="text-center py-12">
				<span class="text-5xl block mb-3">🌈</span>
				<p class="text-text-soft font-semibold">{$t('wishlist.empty')}</p>
			</div>
		{/if}
	</div>
{/if}
