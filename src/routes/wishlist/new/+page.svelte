<script lang="ts">
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { nanoid } from 'nanoid';
	import { db } from '$lib/firebase';
	import { user } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import AuthGuard from '$lib/components/AuthGuard.svelte';

	let title = $state('');
	let description = $state('');
	let creating = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const currentUser = $user;
		if (!currentUser || !title.trim()) return;

		creating = true;
		try {
			const docRef = await addDoc(collection(db, 'wishlists'), {
				ownerId: currentUser.uid,
				ownerName: currentUser.displayName || currentUser.email?.split('@')[0] || '',
				title: title.trim(),
				description: description.trim() || null,
				shareToken: nanoid(12),
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp()
			});
			goto(`/wishlist/${docRef.id}`);
		} catch {
			creating = false;
		}
	}
</script>

<AuthGuard>
	<div class="max-w-md mx-auto">
		<div class="text-center mb-6">
			<span class="text-4xl block mb-2">✨</span>
			<h1 class="text-2xl font-extrabold text-text">{$t('wishlist.new')}</h1>
		</div>

		<form onsubmit={handleSubmit} class="space-y-5 bg-card rounded-2xl border-2 border-primary-light/30 p-6 shadow-lg shadow-primary/5">
			<div>
				<label for="title" class="block text-sm font-bold text-text mb-1.5">
					🏷️ {$t('wishlist.title')}
				</label>
				<input
					id="title"
					type="text"
					bind:value={title}
					required
					placeholder={$t('wishlist.titlePlaceholder')}
					class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted"
				/>
			</div>

			<div>
				<label for="desc" class="block text-sm font-bold text-text mb-1.5">
					📝 {$t('wishlist.description')}
				</label>
				<textarea
					id="desc"
					bind:value={description}
					placeholder={$t('wishlist.descriptionPlaceholder')}
					rows="3"
					class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted"
				></textarea>
			</div>

			<button
				type="submit"
				disabled={!title.trim() || creating}
				class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
			>
				{creating ? $t('wishlist.creating') : `🎁 ${$t('wishlist.create')}`}
			</button>
		</form>
	</div>
</AuthGuard>
