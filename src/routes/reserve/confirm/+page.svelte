<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';

	let status = $state<'confirming' | 'confirmed' | 'error'>('confirming');
	let errorKey = $state('reserve.pageError');
	let username = $state('');
	let returnedEmail = $state('');

	$effect(() => {
		const token = page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			errorKey = 'reserve.pageError';
			return;
		}

		(async () => {
			try {
				const confirmFn = httpsCallable<{ token: string }, { success: boolean; username: string; email: string }>(functions, 'confirmReservation');
				const result = await confirmFn({ token });
				username = result.data.username;
				returnedEmail = result.data.email;

				if (returnedEmail && typeof localStorage !== 'undefined') {
					localStorage.setItem('wishy-visitor-email', returnedEmail);
				}

				status = 'confirmed';
			} catch (err: any) {
				status = 'error';
				const code = err?.code || '';
				if (code.includes('deadline-exceeded')) {
					errorKey = 'reserve.pageExpired';
				} else if (code.includes('already-exists')) {
					errorKey = 'reserve.pageAlreadyReserved';
				} else {
					errorKey = 'reserve.pageError';
				}
			}
		})();
	});
</script>

<div class="min-h-[60vh] flex items-center justify-center">
	<div class="max-w-sm w-full">
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-8 shadow-lg shadow-primary/5 text-center space-y-4">
			{#if status === 'confirming'}
				<span class="text-5xl block animate-float">🎁</span>
				<p class="font-bold text-text">{$t('reserve.pageConfirming')}</p>
				<div class="flex justify-center gap-1.5">
					<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
					<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
					<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
				</div>
			{:else if status === 'confirmed'}
				<span class="text-5xl block">✨</span>
				<h1 class="text-xl font-extrabold text-text">{$t('reserve.pageConfirmed')}</h1>
				<p class="text-sm text-text-soft">{$t('reserve.pageConfirmedDesc')}</p>
				{#if username}
					<a
						href="/lists/{username}"
						class="inline-block font-bold bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 mt-2"
					>
						{$t('reserve.pageBackToList')}
					</a>
				{/if}
			{:else}
				<span class="text-5xl block">😕</span>
				<h1 class="text-xl font-extrabold text-text">{$t('reserve.pageError')}</h1>
				<p class="text-sm text-text-soft">{$t(errorKey)}</p>
				<a
					href="/"
					class="inline-block font-bold border-2 border-primary-light/30 text-text-soft px-6 py-3 rounded-full text-sm hover:bg-primary-light/10 transition-all active:scale-95 mt-2"
				>
					{$t('common.back')}
				</a>
			{/if}
		</div>
	</div>
</div>
