<script lang="ts">
	import {
		collection, query, where, getDocs, onSnapshot, orderBy,
		doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp
	} from 'firebase/firestore';
	import { nanoid } from 'nanoid';
	import { httpsCallable } from 'firebase/functions';
	import { db, functions } from '$lib/firebase';
	import { user, userProfile, isLoggedIn } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import { locale } from '$lib/i18n';
	import { page } from '$app/state';
	import WishItem from '$lib/components/WishItem.svelte';
	import WishForm from '$lib/components/WishForm.svelte';
	import ReserveModal from '$lib/components/ReserveModal.svelte';
	import type { Wishlist, WishItem as WishItemType, Reservation } from '$lib/types';

	let wishlist = $state<Wishlist | null>(null);
	let ownerName = $state('');
	let items = $state<WishItemType[]>([]);
	let reservations = $state<Record<string, Reservation>>({});
	let loading = $state(true);
	let isOwner = $state(false);

	let confirmedNotOwner = $state(false);

	let visitorEmail = $state(
		typeof localStorage !== 'undefined' ? localStorage.getItem('wishy-visitor-email') || '' : ''
	);

	let reservingItem = $state<WishItemType | null>(null);
	let editingItem = $state<WishItemType | null>(null);
	let addFormKey = $state(0);
	let copied = $state(false);
	let toast = $state('');
	let exchangeRates = $state<Record<string, number> | null>(null);

	const sortedItems = $derived(
		[...items].sort((a, b) => {
			if (a.favorite && !b.favorite) return -1;
			if (!a.favorite && b.favorite) return 1;
			return a.order - b.order;
		})
	);

	const username = $derived(page.params.username);

	const needsConfirmation = $derived(!isOwner && !confirmedNotOwner && !loading && wishlist !== null);
	const canSeeReservations = $derived(!isOwner && confirmedNotOwner);

	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(msg: string) {
		clearTimeout(toastTimer);
		toast = msg;
		toastTimer = setTimeout(() => (toast = ''), 3000);
	}

	$effect(() => {
		getDoc(doc(db, 'config', 'exchangeRates')).then((snap) => {
			if (snap.exists()) exchangeRates = snap.data().rates;
		});
	});

	$effect(() => {
		if (!username) return;
		if (typeof sessionStorage !== 'undefined') {
			const stored = sessionStorage.getItem(`wishy-confirmed-${username}`);
			if (stored === 'true') {
				confirmedNotOwner = true;
			}
		}
	});

	let wishlistId = $state<string | null>(null);

	$effect(() => {
		if (!username) return;

		let unsubs: (() => void)[] = [];

		(async () => {
			const usernameDoc = await getDoc(doc(db, 'usernames', username));
			if (!usernameDoc.exists()) {
				loading = false;
				return;
			}

			const userId = usernameDoc.data().userId;

			const q = query(
				collection(db, 'wishlists'),
				where('ownerId', '==', userId),
				orderBy('createdAt', 'desc')
			);
			const snap = await getDocs(q);

			const currentUser = $user;
			const ownerIsMe = !!(currentUser && currentUser.uid === userId);

			let wDocId: string;

			if (snap.empty && ownerIsMe) {
				const docRef = await addDoc(collection(db, 'wishlists'), {
					ownerId: currentUser!.uid,
					ownerName: $userProfile?.displayName || currentUser!.email?.split('@')[0] || '',
					title: $t('wishlist.defaultTitle'),
					description: null,
					shareToken: nanoid(12),
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
				wDocId = docRef.id;
			} else if (snap.empty) {
				loading = false;
				return;
			} else {
				wDocId = snap.docs[0].id;
			}

			const wDocRef = doc(db, 'wishlists', wDocId);

			unsubs.push(
				onSnapshot(wDocRef, (wSnap) => {
					if (wSnap.exists()) {
						const data = wSnap.data();
						wishlist = { id: wSnap.id, ...data } as Wishlist;
						wishlistId = wSnap.id;
						ownerName = data.ownerName || username;
						isOwner = ownerIsMe;

						if (currentUser && !isOwner) {
							confirmedNotOwner = true;
						}
					}
					loading = false;
				})
			);

			const itemsQuery = query(
				collection(db, 'wishlists', wDocId, 'items'),
				orderBy('order', 'asc')
			);
			unsubs.push(
				onSnapshot(itemsQuery, (itemSnap) => {
					items = itemSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as WishItemType);
				})
			);
		})();

		return () => unsubs.forEach((u) => u());
	});

	$effect(() => {
		if (!wishlistId || !confirmedNotOwner || isOwner) return;

		const unsub = onSnapshot(collection(db, 'wishlists', wishlistId, 'reservations'), (resSnap) => {
			const res: Record<string, Reservation> = {};
			for (const d of resSnap.docs) {
				res[d.id] = d.data() as Reservation;
			}
			reservations = res;
		});

		return () => unsub();
	});

	function handleConfirmNotOwner() {
		confirmedNotOwner = true;
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.setItem(`wishy-confirmed-${username}`, 'true');
		}
	}

	function openReserveModal(item: WishItemType) {
		reservingItem = item;
	}

	function closeReserveModal() {
		reservingItem = null;
	}

	async function handleLoggedInReserve() {
		if (!wishlist || !reservingItem) return;
		const reserveFn = httpsCallable(functions, 'reserveItem');
		await reserveFn({
			wishlistId: wishlist.id,
			itemId: reservingItem.id,
			baseUrl: window.location.origin,
			username,
			locale: $locale,
		});
	}

	async function handleVisitorSendEmail(email: string) {
		if (!wishlist || !reservingItem) return;
		const normalized = email.toLowerCase().trim();
		const requestFn = httpsCallable(functions, 'requestReservation');
		await requestFn({
			email: normalized,
			wishlistId: wishlist.id,
			itemId: reservingItem.id,
			baseUrl: window.location.origin,
			username,
			locale: $locale,
		});
		visitorEmail = normalized;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('wishy-visitor-email', normalized);
		}
	}

	// Owner actions
	async function addItem(data: {
		name: string; url: string; price: number | null;
		currency: string; imageUrl: string; notes: string;
	}) {
		if (!wishlist) return;
		await addDoc(collection(db, 'wishlists', wishlist.id, 'items'), {
			...data,
			url: data.url || null,
			imageUrl: data.imageUrl || null,
			notes: data.notes || null,
			favorite: false,
			order: items.length,
			createdAt: serverTimestamp()
		});
		addFormKey++;
	}

	async function toggleFavorite(item: WishItemType) {
		if (!wishlist) return;
		const newVal = !item.favorite;
		await updateDoc(doc(db, 'wishlists', wishlist.id, 'items', item.id), {
			favorite: newVal
		});
		showToast(newVal ? `⭐ ${$t('item.favoriteAdded')}` : $t('item.favoriteRemoved'));
	}

	async function updateItem(data: {
		name: string; url: string; price: number | null;
		currency: string; imageUrl: string; notes: string;
	}) {
		if (!editingItem || !wishlist) return;
		await updateDoc(doc(db, 'wishlists', wishlist.id, 'items', editingItem.id), {
			...data,
			url: data.url || null,
			imageUrl: data.imageUrl || null,
			notes: data.notes || null
		});
		editingItem = null;
	}

	async function deleteItem(itemId: string) {
		if (!wishlist || !confirm($t('item.deleteConfirm'))) return;
		await deleteDoc(doc(db, 'wishlists', wishlist.id, 'items', itemId));
	}

	async function copyShareLink() {
		const url = `${window.location.origin}/lists/${username}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
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
{:else if needsConfirmation}
	<div class="max-w-md mx-auto py-12">
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-6 shadow-lg shadow-primary/5 text-center space-y-5">
			<span class="text-5xl block">🎁</span>
			<h1 class="text-xl font-extrabold text-text">
				{$t('shared.confirmNotOwner', { name: ownerName })}
			</h1>
			<p class="text-sm text-text-soft leading-relaxed">
				{$t('shared.confirmNotOwnerDesc')}
			</p>
			<div class="space-y-3 pt-2">
				<button
					onclick={handleConfirmNotOwner}
					class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
				>
					{$t('shared.iAmNotOwner', { name: ownerName })}
				</button>
				<a
					href="/"
					class="block w-full text-sm font-semibold text-text-muted hover:text-text-soft transition-colors py-2"
				>
					{$t('shared.iAmOwner')}
				</a>
			</div>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		{#if isOwner}
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-extrabold text-text">{$t('dashboard.myWishlist')}</h1>
				<button
					onclick={copyShareLink}
					class="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all active:scale-95 {copied ? 'border-success/50 text-success bg-success/10' : 'border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10'}"
				>
					{copied ? '✅ ' : '🔗 '}{copied ? $t('wishlist.copied') : $t('wishlist.share')}
				</button>
			</div>
		{:else}
			<div>
				<h1 class="text-2xl font-extrabold text-text">
					{$t('shared.title', { name: ownerName })}
				</h1>
				{#if wishlist.description}
					<p class="text-text-muted mt-1">{wishlist.description}</p>
				{/if}
			</div>
		{/if}

		{#if items.length === 0}
			<div class="text-center py-6">
				<span class="text-4xl block mb-2">🌈</span>
				<p class="text-text-soft font-semibold">{$t('wishlist.empty')}</p>
			</div>
		{/if}

		<div class="space-y-3">
			{#each sortedItems as item (item.id)}
				{#if isOwner && editingItem?.id === item.id}
					<WishForm
						initialName={item.name}
						initialUrl={item.url || ''}
						initialPrice={item.price?.toString() || ''}
						initialCurrency={item.currency || 'DKK'}
						initialImageUrl={item.imageUrl || ''}
						initialNotes={item.notes || ''}
						onsave={updateItem}
						oncancel={() => (editingItem = null)}
					/>
				{:else}
					<WishItem
						{item}
						reservation={canSeeReservations ? (reservations[item.id] || null) : null}
						isShared={!isOwner}
						{isOwner}
						currentUserId={$user?.uid || ''}
						{visitorEmail}
						{exchangeRates}
						onedit={() => (editingItem = item)}
						ondelete={() => deleteItem(item.id)}
						ontogglefavorite={() => toggleFavorite(item)}
						onreserve={() => openReserveModal(item)}
					/>
				{/if}
			{/each}
		</div>

		{#if isOwner}
			{#key addFormKey}
				<WishForm onsave={addItem} />
			{/key}
		{/if}
	</div>
{/if}

{#if reservingItem}
	<ReserveModal
		item={reservingItem}
		isLoggedIn={$isLoggedIn}
		onclose={closeReserveModal}
		onconfirm={handleLoggedInReserve}
		onsend={handleVisitorSendEmail}
	/>
{/if}

{#if toast}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg animate-pop-in z-50">
		{toast}
	</div>
{/if}
