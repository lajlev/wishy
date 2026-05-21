<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { t } from '$lib/i18n';
	import { page } from '$app/state';

	let status = $state<'cancelling' | 'cancelled' | 'error'>('cancelling');
	let errorKey = $state('reserve.cancelError');
	let username = $state('');

	$effect(() => {
		const token = page.url.searchParams.get('token');
		if (!token) {
			status = 'error';
			errorKey = 'reserve.cancelError';
			return;
		}

		(async () => {
			try {
				const cancelFn = httpsCallable<{ token: string }, { success: boolean; username: string }>(functions, 'cancelReservation');
				const result = await cancelFn({ token });
				username = result.data.username;
				status = 'cancelled';
			} catch (err: any) {
				status = 'error';
				const code = err?.code || '';
				if (code.includes('not-found')) {
					errorKey = 'reserve.cancelNotFound';
				} else {
					errorKey = 'reserve.cancelError';
				}
			}
		})();
	});
</script>

<div class="min-h-[60vh] flex items-center justify-center">
	<div class="max-w-sm w-full">
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-8 shadow-lg shadow-primary/5 text-center space-y-4">
			{#if status === 'cancelling'}
				<span class="text-5xl block animate-float">🎁</span>
				<p class="font-bold text-text">{$t('reserve.cancelConfirming')}</p>
				<div class="flex justify-center gap-1.5">
					<span class="w-2 h-2 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
					<span class="w-2 h-2 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
					<span class="w-2 h-2 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
				</div>
			{:else if status === 'cancelled'}
				<span class="text-5xl block">✅</span>
				<h1 class="text-xl font-extrabold text-text">{$t('reserve.cancelConfirmed')}</h1>
				<p class="text-sm text-text-soft">{$t('reserve.cancelConfirmedDesc')}</p>
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
				<h1 class="text-xl font-extrabold text-text">{$t('reserve.cancelError')}</h1>
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
