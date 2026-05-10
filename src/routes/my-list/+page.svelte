<script lang="ts">
	import {
		doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc,
		serverTimestamp, query, where, orderBy, getDocs
	} from 'firebase/firestore';
	import { nanoid } from 'nanoid';
	import { db } from '$lib/firebase';
	import {
		user, userProfile, hasUsername, checkUsernameAvailable, claimUsername
	} from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import WishItem from '$lib/components/WishItem.svelte';
	import WishForm from '$lib/components/WishForm.svelte';
	import type { Wishlist, WishItem as WishItemType } from '$lib/types';

	let wishlist = $state<Wishlist | null>(null);
	let items = $state<WishItemType[]>([]);
	let loading = $state(true);
	let editingItem = $state<WishItemType | null>(null);
	let copied = $state(false);
	let addFormKey = $state(0);

	let usernameInput = $state('');
	let usernameError = $state('');
	let checkingUsername = $state(false);
	let savingUsername = $state(false);

	const usernamePattern = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;

	$effect(() => {
		const currentUser = $user;
		const profile = $userProfile;
		if (!currentUser || !profile?.username) return;

		let unsubs: (() => void)[] = [];

		(async () => {
			const q = query(
				collection(db, 'wishlists'),
				where('ownerId', '==', currentUser.uid),
				orderBy('createdAt', 'desc')
			);
			const snap = await getDocs(q);

			let wishlistId: string;

			if (snap.empty) {
				const docRef = await addDoc(collection(db, 'wishlists'), {
					ownerId: currentUser.uid,
					ownerName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
					title: $t('wishlist.defaultTitle'),
					description: null,
					shareToken: nanoid(12),
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				});
				wishlistId = docRef.id;
			} else {
				wishlistId = snap.docs[0].id;
			}

			unsubs.push(
				onSnapshot(doc(db, 'wishlists', wishlistId), (snap) => {
					if (snap.exists()) {
						wishlist = { id: snap.id, ...snap.data() } as Wishlist;
					}
					loading = false;
				})
			);

			const itemsQuery = query(collection(db, 'wishlists', wishlistId, 'items'), orderBy('order', 'asc'));
			unsubs.push(
				onSnapshot(itemsQuery, (snap) => {
					items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WishItemType);
				})
			);
		})();

		return () => unsubs.forEach((u) => u());
	});

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
			order: items.length,
			createdAt: serverTimestamp()
		});
		addFormKey++;
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
		const profile = $userProfile;
		if (!profile?.username) return;
		const url = `${window.location.origin}/lists/${profile.username}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function validateUsername() {
		const val = usernameInput.toLowerCase().trim();
		usernameInput = val;
		usernameError = '';

		if (!val) return;
		if (val.length < 3) {
			usernameError = $t('username.tooShort');
			return;
		}
		if (!usernamePattern.test(val)) {
			usernameError = $t('username.invalid');
			return;
		}

		checkingUsername = true;
		const available = await checkUsernameAvailable(val);
		checkingUsername = false;

		if (!available) {
			usernameError = $t('username.taken');
		}
	}

	async function handleClaimUsername(e: Event) {
		e.preventDefault();
		const val = usernameInput.toLowerCase().trim();
		if (!val || usernameError || !usernamePattern.test(val)) return;

		savingUsername = true;
		try {
			await claimUsername(val);
		} catch {
			usernameError = $t('common.error');
		}
		savingUsername = false;
	}
</script>

<AuthGuard>
	{#if !$hasUsername}
		<div class="max-w-md mx-auto">
			<div class="text-center mb-6">
				<span class="text-4xl block mb-2">👋</span>
				<h1 class="text-2xl font-extrabold text-text">{$t('username.title')}</h1>
				<p class="text-text-soft mt-2">{$t('username.subtitle')}</p>
			</div>

			<form onsubmit={handleClaimUsername} class="space-y-5 bg-card rounded-2xl border-2 border-primary-light/30 p-6 shadow-lg shadow-primary/5">
				<div>
					<label for="username" class="block text-sm font-bold text-text mb-1.5">
						{$t('username.label')}
					</label>
					<div class="flex items-center gap-2">
						<span class="text-sm text-text-muted font-mono">wish.lajlev.dk/lists/</span>
						<input
							id="username"
							type="text"
							bind:value={usernameInput}
							oninput={validateUsername}
							required
							minlength="3"
							maxlength="20"
							pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
							placeholder="michael"
							class="flex-1 rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted font-mono"
						/>
					</div>
					{#if checkingUsername}
						<p class="text-xs text-text-muted mt-1">{$t('username.checking')}</p>
					{:else if usernameError}
						<p class="text-xs text-danger mt-1">{usernameError}</p>
					{:else if usernameInput.length >= 3 && usernamePattern.test(usernameInput)}
						<p class="text-xs text-success mt-1">{$t('username.available')}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={!usernameInput.trim() || !!usernameError || checkingUsername || savingUsername || !usernamePattern.test(usernameInput)}
					class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
				>
					{savingUsername ? $t('username.saving') : $t('username.save')}
				</button>
			</form>
		</div>
	{:else if loading}
		<div class="flex flex-col items-center py-12 gap-3">
			<span class="text-4xl animate-float">🎁</span>
			<div class="flex gap-1.5">
				<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
				<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
				<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
			</div>
		</div>
	{:else if wishlist}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h1 class="text-xl font-extrabold text-text">{$t('dashboard.myWishlist')}</h1>
				<button
					onclick={copyShareLink}
					class="flex-shrink-0 text-sm font-bold px-4 py-2 rounded-full border-2 transition-all active:scale-95 {copied ? 'border-success/50 text-success bg-success/10' : 'border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10'}"
				>
					{copied ? '✅ ' : '🔗 '}{copied ? $t('wishlist.copied') : $t('wishlist.share')}
				</button>
			</div>

			<!-- Wish items -->
			{#if items.length === 0}
				<div class="text-center py-6">
					<span class="text-4xl block mb-2">🌈</span>
					<p class="text-text-soft font-semibold">{$t('wishlist.empty')}</p>
				</div>
			{/if}

			<div class="space-y-3">
				{#each items as item (item.id)}
					{#if editingItem?.id === item.id}
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
							isOwner={true}
							onedit={() => (editingItem = item)}
							ondelete={() => deleteItem(item.id)}
						/>
					{/if}
				{/each}
			</div>

			{#key addFormKey}
				<WishForm onsave={addItem} />
			{/key}
		</div>
	{/if}
</AuthGuard>
