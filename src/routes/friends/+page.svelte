<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { user, userProfile } from '$lib/stores/auth';
	import { listenToFriends, removeFriend, type FriendEntry } from '$lib/friends';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import FriendAvatar from '$lib/components/FriendAvatar.svelte';
	import ShareListPanel from '$lib/components/ShareListPanel.svelte';

	let friends = $state<FriendEntry[]>([]);
	let loaded = $state(false);
	let removing = $state<string | null>(null);
	let toast = $state('');
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(msg: string) {
		clearTimeout(toastTimer);
		toast = msg;
		toastTimer = setTimeout(() => (toast = ''), 3000);
	}

	// Users without a profile/username are sent to set one up first
	$effect(() => {
		if ($userProfile && !$userProfile.username) {
			goto(`/my-list?redirect=${encodeURIComponent('/friends')}`, { replaceState: true });
		}
	});

	$effect(() => {
		const uid = $user?.uid;
		if (!uid) return;
		return listenToFriends(uid, (list) => {
			friends = list;
			loaded = true;
		});
	});

	async function handleRemove(friend: FriendEntry) {
		const name = friend.displayName || friend.username;
		if (!confirm($t('friends.removeConfirm', { name }))) return;
		removing = friend.uid;
		try {
			await removeFriend(friend.uid);
			showToast($t('friends.removed', { name }));
		} catch {
			showToast($t('common.error'));
		}
		removing = null;
	}
</script>

<AuthGuard>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-extrabold text-text flex items-center gap-2">
				<span>👯</span>
				{$t('friends.title')}
			</h1>
			<p class="text-text-soft mt-1 text-sm leading-relaxed">{$t('friends.subtitle')}</p>
		</div>

		{#if !loaded}
			<div class="flex justify-center py-8 gap-1.5">
				<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
				<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
				<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
			</div>
		{:else if friends.length === 0}
			<div class="text-center py-8 bg-card rounded-2xl border-2 border-primary-light/30">
				<span class="text-5xl block mb-3">🌟</span>
				<p class="text-text-soft font-semibold px-6">{$t('friends.empty')}</p>
			</div>
		{:else}
			<ul class="space-y-3">
				{#each friends as friend (friend.uid)}
					<li class="flex items-center gap-3 bg-card rounded-2xl border-2 border-primary-light/30 p-3 hover:border-primary/40 transition-colors">
						<a href="/lists/{friend.username}" class="group flex items-center gap-3 flex-1 min-w-0">
							<FriendAvatar name={friend.displayName || friend.username} photoUrl={friend.photoUrl} />
							<div class="min-w-0">
								<p class="font-bold text-text text-sm truncate group-hover:text-primary transition-colors">
									{friend.displayName || friend.username}
								</p>
								<p class="text-xs text-text-muted">@{friend.username} · {$t('friends.viewList')} →</p>
							</div>
						</a>
						<button
							onclick={() => handleRemove(friend)}
							disabled={removing === friend.uid}
							class="flex-shrink-0 text-xs font-semibold text-text-muted hover:text-danger px-3 py-1.5 rounded-full hover:bg-danger/10 disabled:opacity-50 transition-colors"
						>
							{$t('friends.remove')}
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if $userProfile?.username}
			<ShareListPanel username={$userProfile.username} displayName={$userProfile.displayName || ''} />
		{/if}
	</div>
</AuthGuard>

{#if toast}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-text text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-lg animate-pop-in z-50">
		{toast}
	</div>
{/if}
