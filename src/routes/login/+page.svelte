<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { t, locale } from '$lib/i18n';
	import { isLoggedIn } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let email = $state('');
	let sent = $state(false);
	let sending = $state(false);
	let error = $state('');

	$effect(() => {
		if ($isLoggedIn) {
			const redirect = page.url.searchParams.get('redirect') || '/';
			goto(redirect);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!email.trim()) return;

		sending = true;
		error = '';

		const redirect = page.url.searchParams.get('redirect') || '/';
		const callbackUrl = `${window.location.origin}/login/callback?redirect=${encodeURIComponent(redirect)}`;

		try {
			const sendLogin = httpsCallable(functions, 'sendLoginEmail');
			await sendLogin({ email, callbackUrl, locale: $locale });
			localStorage.setItem('wishy-login-email', email);
			sent = true;
		} catch (e) {
			error = $t('login.error');
		} finally {
			sending = false;
		}
	}
</script>

<div class="max-w-sm mx-auto mt-12">
	<div class="text-center mb-8">
		<span class="text-6xl block mb-3 animate-float">🎁</span>
		<h1 class="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">{$t('login.title')}</h1>
		<p class="text-text-soft font-medium">{$t('login.subtitle')}</p>
	</div>

	{#if sent}
		<div class="bg-success/10 border-2 border-success/30 rounded-2xl p-6 text-center animate-pop-in">
			<span class="text-4xl block mb-3">✉️</span>
			<p class="text-text font-semibold">
				{$t('login.sent', { email })}
			</p>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-5 bg-card rounded-2xl border-2 border-primary-light/30 p-6 shadow-lg shadow-primary/5">
			<div>
				<label for="email" class="block text-sm font-bold text-text mb-1.5">
					📧 {$t('login.email')}
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					placeholder="din@email.dk"
					class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted"
				/>
			</div>

			{#if error}
				<p class="text-sm font-semibold text-danger">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={sending || !email.trim()}
				class="w-full font-bold bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
			>
				{sending ? $t('login.sending') : `✨ ${$t('login.send')}`}
			</button>
		</form>
	{/if}
</div>
