<script lang="ts">
	import { collection, getDocs } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { isLoggedIn, userProfile } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import type { PublicProfile } from '$lib/types';

	let profiles = $state<(PublicProfile & { username: string })[]>([]);
	let loading = $state(true);

	$effect(() => {
		(async () => {
			const snap = await getDocs(collection(db, 'usernames'));
			profiles = snap.docs.map((d) => ({
				username: d.id,
				...d.data()
			})) as (PublicProfile & { username: string })[];
			loading = false;
		})();
	});
</script>

<div class="space-y-6">
	<div class="text-center">
		<h1 class="text-2xl font-extrabold text-text">{$t('home.title')}</h1>
		<p class="text-text-soft mt-1">{$t('home.subtitle')}</p>
	</div>

	{#if $isLoggedIn && $userProfile?.username}
		<div class="flex justify-center">
			<a
				href="/my-list"
				class="font-bold bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
			>
				🎁 {$t('nav.myList')}
			</a>
		</div>
	{:else if !$isLoggedIn}
		<div class="flex justify-center">
			<a
				href="/login"
				class="font-bold bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
			>
				✨ {$t('home.createYours')}
			</a>
		</div>
	{/if}

	{#if loading}
		<div class="flex flex-col items-center py-12 gap-3">
			<span class="text-4xl animate-float">🎁</span>
			<div class="flex gap-1.5">
				<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
				<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
				<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
			</div>
		</div>
	{:else if profiles.length === 0}
		<div class="text-center py-12">
			<span class="text-5xl block mb-3">🌟</span>
			<p class="text-text-soft font-semibold">{$t('home.noUsers')}</p>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
			{#each profiles as profile (profile.username)}
				<a
					href="/lists/{profile.username}"
					class="group flex flex-col items-center gap-3 bg-card rounded-2xl border-2 border-primary-light/30 p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 transition-all duration-200"
				>
					{#if profile.photoUrl}
						<img
							src={profile.photoUrl}
							alt={profile.displayName || profile.username}
							class="w-16 h-16 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
						/>
					{:else}
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-2xl border-2 border-primary-light/40">
							{(profile.displayName || profile.username).charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="text-center min-w-0 w-full">
						<p class="font-bold text-text text-sm truncate">{profile.displayName || profile.username}</p>
						<p class="text-xs text-text-muted">@{profile.username}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
