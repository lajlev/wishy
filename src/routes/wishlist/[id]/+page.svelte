<script lang="ts">
	import {
		doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc,
		serverTimestamp, query, orderBy
	} from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
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

	const wishlistId = $derived(page.params.id);

	$effect(() => {
		const id = wishlistId;
		if (!id) return;

		const unsub1 = onSnapshot(doc(db, 'wishlists', id), (snap) => {
			if (snap.exists()) {
				wishlist = { id: snap.id, ...snap.data() } as Wishlist;
			}
			loading = false;
		});

		const q = query(collection(db, 'wishlists', id, 'items'), orderBy('order', 'asc'));
		const unsub2 = onSnapshot(q, (snap) => {
			items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WishItemType);
		});

		return () => { unsub1(); unsub2(); };
	});

	async function addItem(data: {
		name: string; url: string; price: number | null;
		currency: string; imageUrl: string; notes: string;
	}) {
		await addDoc(collection(db, 'wishlists', wishlistId, 'items'), {
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
		if (!editingItem) return;
		await updateDoc(doc(db, 'wishlists', wishlistId, 'items', editingItem.id), {
			...data,
			url: data.url || null,
			imageUrl: data.imageUrl || null,
			notes: data.notes || null
		});
		editingItem = null;
	}

	async function deleteItem(itemId: string) {
		if (!confirm($t('item.deleteConfirm'))) return;
		await deleteDoc(doc(db, 'wishlists', wishlistId, 'items', itemId));
	}

	async function deleteWishlist() {
		if (!confirm($t('wishlist.deleteConfirm'))) return;
		await deleteDoc(doc(db, 'wishlists', wishlistId));
		goto('/');
	}

	async function copyShareLink() {
		if (!wishlist) return;
		const url = `${window.location.origin}/shared/${wishlist.shareToken}`;
		await navigator.clipboard.writeText(url);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<AuthGuard>
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
			<div class="flex items-start justify-between gap-4">
				<div>
					<h1 class="text-2xl font-extrabold text-text">{wishlist.title}</h1>
					{#if wishlist.description}
						<p class="text-text-soft mt-1">{wishlist.description}</p>
					{/if}
				</div>
				<div class="flex gap-2 flex-shrink-0">
					<button
						onclick={copyShareLink}
						class="text-sm font-bold px-4 py-2 rounded-full border-2 transition-all active:scale-95 {copied ? 'border-success/50 text-success bg-success/10' : 'border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10'}"
					>
						{copied ? '✅ ' : '🔗 '}{copied ? $t('wishlist.copied') : $t('wishlist.share')}
					</button>
					<button
						onclick={deleteWishlist}
						class="text-sm font-semibold text-danger px-4 py-2 rounded-full border-2 border-danger/30 hover:border-danger hover:bg-red-50 transition-all active:scale-95"
					>
						{$t('wishlist.delete')}
					</button>
				</div>
			</div>

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
