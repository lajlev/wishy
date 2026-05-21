<script lang="ts">
	import { t } from '$lib/i18n';
	import type { WishItem } from '$lib/types';

	let {
		item,
		isLoggedIn = false,
		onclose,
		onconfirm,
		onsend
	}: {
		item: WishItem;
		isLoggedIn?: boolean;
		onclose: () => void;
		onconfirm: () => Promise<void>;
		onsend: (email: string) => Promise<void>;
	} = $props();

	let emailInput = $state(
		typeof localStorage !== 'undefined' ? localStorage.getItem('wishy-visitor-email') || '' : ''
	);
	let status = $state<'idle' | 'sending' | 'emailSent' | 'confirming' | 'confirmed' | 'error'>('idle');
	let errorMsg = $state('');

	async function handleConfirm() {
		status = 'confirming';
		errorMsg = '';
		try {
			await onconfirm();
			status = 'confirmed';
		} catch (err: any) {
			status = 'error';
			const code = err?.code || '';
			if (code.includes('already-exists')) {
				errorMsg = $t('shared.alreadyReserved');
			} else {
				errorMsg = $t('common.error');
			}
		}
	}

	async function handleSendEmail(e: Event) {
		e.preventDefault();
		if (!emailInput.includes('@')) return;
		status = 'sending';
		errorMsg = '';
		try {
			await onsend(emailInput.toLowerCase().trim());
			status = 'emailSent';
		} catch (err: any) {
			status = 'error';
			const code = err?.code || '';
			if (code.includes('already-exists')) {
				errorMsg = $t('shared.alreadyReserved');
			} else {
				errorMsg = $t('common.error');
			}
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
	onclick={handleBackdropClick}
>
	<div class="bg-card rounded-2xl border-2 border-primary-light/30 shadow-xl shadow-primary/10 w-full max-w-sm animate-pop-in">
		<div class="flex justify-end p-3 pb-0">
			<button
				onclick={onclose}
				class="text-text-muted hover:text-text-soft transition-colors text-lg leading-none"
			>
				✕
			</button>
		</div>

		<div class="px-6 pb-2 text-center">
			{#if item.imageUrl}
				<img
					src={item.imageUrl}
					alt={item.name}
					class="w-24 h-24 object-cover rounded-xl border-2 border-primary-light/20 mx-auto mb-3"
				/>
			{/if}
			<h3 class="font-bold text-text text-lg">{item.name}</h3>
			{#if item.price}
				<p class="text-sm text-primary font-bold mt-1">{item.price} {item.currency || 'DKK'}</p>
			{/if}
		</div>

		<div class="px-6 pb-6 pt-4">
			{#if status === 'confirmed'}
				<div class="text-center space-y-3">
					<span class="text-4xl block">✨</span>
					<p class="font-bold text-text">{$t('reserve.confirmed')}</p>
					<p class="text-sm text-text-soft">{$t('reserve.checkEmail')}</p>
					<button
						onclick={onclose}
						class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg transition-all active:scale-95"
					>
						{$t('reserve.close')}
					</button>
				</div>
			{:else if status === 'emailSent'}
				<div class="text-center space-y-3">
					<span class="text-4xl block">📬</span>
					<p class="font-bold text-text">{$t('reserve.emailSent')}</p>
					<p class="text-sm text-text-soft">{$t('reserve.emailSentDesc', { email: emailInput })}</p>
					<button
						onclick={onclose}
						class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg transition-all active:scale-95"
					>
						{$t('reserve.close')}
					</button>
				</div>
			{:else if status === 'error'}
				<div class="text-center space-y-3">
					<span class="text-4xl block">😕</span>
					<p class="text-sm text-danger">{errorMsg}</p>
					<button
						onclick={onclose}
						class="w-full font-bold border-2 border-primary-light/30 text-text-soft px-4 py-3 rounded-full text-sm hover:bg-primary-light/10 transition-all active:scale-95"
					>
						{$t('reserve.close')}
					</button>
				</div>
			{:else if isLoggedIn}
				<div class="space-y-4">
					<p class="text-sm text-text-soft text-center">{$t('reserve.confirmPrompt')}</p>
					<button
						onclick={handleConfirm}
						disabled={status === 'confirming'}
						class="w-full font-bold bg-gradient-to-r from-success to-emerald-500 text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-success/20 disabled:opacity-50 transition-all active:scale-95"
					>
						{status === 'confirming' ? $t('reserve.reserving') : $t('reserve.confirmButton')}
					</button>
				</div>
			{:else}
				<form onsubmit={handleSendEmail} class="space-y-4">
					<p class="text-sm text-text-soft text-center">{$t('reserve.enterEmailPrompt')}</p>
					<input
						type="email"
						bind:value={emailInput}
						placeholder={$t('shared.emailPlaceholder')}
						required
						class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted text-center"
					/>
					<button
						type="submit"
						disabled={status === 'sending' || !emailInput.includes('@')}
						class="w-full font-bold bg-gradient-to-r from-success to-emerald-500 text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-success/20 disabled:opacity-50 transition-all active:scale-95"
					>
						{status === 'sending' ? $t('reserve.sending') : $t('reserve.sendButton')}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
