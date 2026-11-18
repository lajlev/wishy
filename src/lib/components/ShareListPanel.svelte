<script lang="ts">
	import { t, locale } from '$lib/i18n';
	import { sendListInvite, shareUrl } from '$lib/friends';

	let {
		username,
		displayName = '',
		onclose
	}: {
		username: string;
		displayName?: string;
		onclose?: () => void;
	} = $props();

	const emailPattern = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

	let email = $state('');
	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle');
	let message = $state('');
	let copied = $state(false);
	const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

	async function handleSend(e: Event) {
		e.preventDefault();
		const value = email.toLowerCase().trim();
		if (!emailPattern.test(value)) {
			status = 'error';
			message = $t('share.errorInvalid');
			return;
		}
		status = 'sending';
		message = '';
		try {
			await sendListInvite(value, $locale);
			status = 'sent';
			message = $t('share.sent', { email: value });
			email = '';
		} catch (err: any) {
			status = 'error';
			const code = err?.code || '';
			if (code.includes('already-exists')) message = $t('share.errorDuplicate');
			else if (code.includes('resource-exhausted')) message = $t('share.errorLimit');
			else if (code.includes('invalid-argument')) message = $t('share.errorInvalid');
			else message = $t('common.error');
		}
	}

	async function copyLink() {
		await navigator.clipboard.writeText(shareUrl(username));
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function nativeShare() {
		try {
			await navigator.share({
				title: displayName ? $t('shared.title', { name: displayName }) : $t('app.name'),
				text: $t('share.nativeText'),
				url: shareUrl(username)
			});
		} catch {
			// user cancelled
		}
	}
</script>

<div class="bg-card rounded-2xl border-2 border-secondary/30 p-5 shadow-lg shadow-secondary/5 space-y-4 animate-pop-in">
	<div class="flex items-start justify-between gap-3">
		<div>
			<h2 class="text-lg font-bold text-text flex items-center gap-2">
				<span class="text-xl">💌</span>
				{$t('share.title')}
			</h2>
			<p class="text-sm text-text-soft mt-1 leading-relaxed">{$t('share.subtitle')}</p>
		</div>
		{#if onclose}
			<button
				onclick={onclose}
				aria-label={$t('share.close')}
				class="text-text-muted hover:text-text-soft transition-colors text-lg leading-none"
			>
				✕
			</button>
		{/if}
	</div>

	<form onsubmit={handleSend} class="space-y-1.5">
		<label for="share-email" class="block text-sm font-bold text-text">📧 {$t('share.emailLabel')}</label>
		<div class="flex gap-2">
			<input
				id="share-email"
				type="email"
				bind:value={email}
				required
				maxlength="254"
				placeholder={$t('share.emailPlaceholder')}
				class="flex-1 min-w-0 rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50 placeholder:text-text-muted"
			/>
			<button
				type="submit"
				disabled={status === 'sending' || !email.trim()}
				class="flex-shrink-0 font-bold bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
			>
				{status === 'sending' ? $t('share.sending') : $t('share.send')}
			</button>
		</div>
		{#if message}
			<p class="text-xs font-semibold {status === 'sent' ? 'text-success' : 'text-danger'}">{message}</p>
		{/if}
	</form>

	<div class="flex flex-wrap gap-2">
		<button
			onclick={copyLink}
			class="text-sm font-bold px-4 py-2 rounded-full border-2 transition-all active:scale-95 {copied ? 'border-success/50 text-success bg-success/10' : 'border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10'}"
		>
			{copied ? `✅ ${$t('share.copied')}` : `🔗 ${$t('share.copy')}`}
		</button>
		{#if canNativeShare}
			<button
				onclick={nativeShare}
				class="text-sm font-bold px-4 py-2 rounded-full border-2 border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10 transition-all active:scale-95"
			>
				📤 {$t('share.native')}
			</button>
		{/if}
	</div>
</div>
