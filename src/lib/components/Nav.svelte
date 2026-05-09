<script lang="ts">
	import { t } from '$lib/i18n';
	import { user, signOut, isLoggedIn } from '$lib/stores/auth';
	import LanguageSwitcher from './LanguageSwitcher.svelte';

	async function handleSignOut() {
		await signOut();
		window.location.href = '/login';
	}
</script>

<nav class="bg-white/80 backdrop-blur-md border-b-2 border-primary-light/40 sticky top-0 z-50">
	<div class="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
		<a href="/" class="flex items-center gap-2 group">
			<span class="text-2xl group-hover:animate-wiggle transition-transform">🎁</span>
			<span class="text-xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
				{$t('app.name')}
			</span>
		</a>
		<div class="flex items-center gap-2">
			<LanguageSwitcher />
			{#if $isLoggedIn}
				<a href="/" class="text-sm font-semibold text-text-soft hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-light/20">
					{$t('nav.myLists')}
				</a>
				<button
					onclick={handleSignOut}
					class="text-sm text-text-muted hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary-light/20"
				>
					{$t('nav.logout')}
				</button>
			{/if}
		</div>
	</div>
</nav>
