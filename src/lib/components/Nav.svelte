<script lang="ts">
	import { t } from '$lib/i18n';
	import { user, signOut, isLoggedIn, isAdmin, userProfile } from '$lib/stores/auth';

	let menuOpen = $state(false);

	async function handleSignOut() {
		menuOpen = false;
		await signOut();
		window.location.href = '/login';
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.profile-menu')) {
			menuOpen = false;
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<nav class="bg-white/80 backdrop-blur-md border-b-2 border-primary-light/40 sticky top-0 z-50">
	<div class="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2 group">
			<span class="text-2xl group-hover:animate-wiggle transition-transform">🎁</span>
			<span class="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
				{$t('app.name')}
			</span>
		</a>
		<div class="flex items-center gap-2">
			<a href="/about" class="text-sm font-semibold text-text-soft hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-light/20">
				{$t('nav.about')}
			</a>
			{#if $isLoggedIn}
				<a href={$userProfile?.username ? `/lists/${$userProfile.username}` : '/my-list'} class="text-sm font-semibold text-text-soft hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-light/20">
					{$t('nav.myList')}
				</a>

				<div class="relative profile-menu">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="flex items-center justify-center w-9 h-9 rounded-full border-2 border-primary-light/40 hover:border-primary/50 transition-colors overflow-hidden"
					>
						{#if $userProfile?.photoUrl}
							<img src={$userProfile.photoUrl} alt="Profile" class="w-full h-full object-cover" />
						{:else}
							<span class="text-sm font-bold text-primary">
								{($userProfile?.displayName || $userProfile?.username || $userProfile?.email || '?').charAt(0).toUpperCase()}
							</span>
						{/if}
					</button>

					{#if menuOpen}
						<div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border-2 border-primary-light/30 shadow-xl shadow-primary/10 py-1 z-50">
							<div class="px-3 py-2 border-b border-primary-light/20">
								<p class="text-sm font-bold text-text truncate">{$userProfile?.displayName || $userProfile?.username}</p>
								<p class="text-xs text-text-muted truncate">{$userProfile?.email}</p>
							</div>

							{#if $isAdmin}
								<a
									href="/admin"
									onclick={() => (menuOpen = false)}
									class="block px-3 py-2 text-sm text-text-soft hover:text-primary hover:bg-primary-light/10 transition-colors"
								>
									Admin
								</a>
							{/if}
							<a
								href="/settings"
								onclick={() => (menuOpen = false)}
								class="block px-3 py-2 text-sm text-text-soft hover:text-primary hover:bg-primary-light/10 transition-colors"
							>
								{$t('nav.settings')}
							</a>
							<button
								onclick={handleSignOut}
								class="w-full text-left px-3 py-2 text-sm text-text-muted hover:text-primary hover:bg-primary-light/10 transition-colors"
							>
								{$t('nav.logout')}
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/login"
					class="font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-1.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
				>
					{$t('nav.login')}
				</a>
			{/if}
		</div>
	</div>
</nav>
