<script lang="ts">
	import { t } from '$lib/i18n';
	import { listenToFriends, type FriendEntry } from '$lib/friends';
	import FriendAvatar from './FriendAvatar.svelte';

	let { uid, onshare }: { uid: string; onshare?: () => void } = $props();

	let friends = $state<FriendEntry[]>([]);
	let loaded = $state(false);

	$effect(() => {
		if (!uid) return;
		return listenToFriends(uid, (list) => {
			friends = list;
			loaded = true;
		});
	});
</script>

<section class="bg-card rounded-2xl border-2 border-primary-light/30 p-4 shadow-sm">
	<div class="flex items-center justify-between mb-3">
		<h2 class="text-sm font-bold text-text flex items-center gap-2">
			<span class="text-lg">👯</span>
			{$t('friends.panelTitle')}
		</h2>
		<a href="/friends" class="text-xs font-bold text-secondary hover:text-secondary-dark transition-colors">
			{$t('friends.seeAll')} →
		</a>
	</div>

	{#if loaded && friends.length === 0}
		<div class="flex items-center justify-between gap-3">
			<p class="text-sm text-text-soft">{$t('friends.empty')}</p>
			{#if onshare}
				<button
					onclick={onshare}
					class="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10 transition-all active:scale-95"
				>
					💌 {$t('wishlist.share')}
				</button>
			{/if}
		</div>
	{:else}
		<div class="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
			{#each friends as friend (friend.uid)}
				<a
					href="/lists/{friend.username}"
					class="group flex flex-col items-center gap-1.5 w-16 flex-shrink-0"
					title={friend.displayName}
				>
					<FriendAvatar name={friend.displayName || friend.username} photoUrl={friend.photoUrl} />
					<span class="text-xs font-semibold text-text-soft group-hover:text-primary truncate w-full text-center transition-colors">
						{friend.displayName || friend.username}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</section>
