<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { t, locale } from '$lib/i18n';
	import Turnstile from '$lib/components/Turnstile.svelte';

	// Inline version of the passwordless email-link flow from /login.
	// Turnstile is only mounted once the visitor engages with the field, so
	// two forms on one page never render two widgets up front.
	let { id }: { id: string } = $props();

	let email = $state('');
	let sent = $state(false);
	let sending = $state(false);
	let error = $state('');
	let captchaToken = $state('');
	let engaged = $state(false);
	let input: HTMLInputElement | undefined = $state();

	let waitingForCaptcha = false;

	function handleSubmit(e: Event) {
		e.preventDefault();
		engaged = true;
		if (!email.trim()) return;
		error = '';
		if (!captchaToken) {
			// Send as soon as the Turnstile check completes.
			waitingForCaptcha = true;
			sending = true;
			return;
		}
		send();
	}

	function onVerify(token: string) {
		captchaToken = token;
		if (waitingForCaptcha) {
			waitingForCaptcha = false;
			send();
		}
	}

	async function send() {
		sending = true;
		const callbackUrl = `${window.location.origin}/login/callback?redirect=${encodeURIComponent('/')}`;

		try {
			const sendLogin = httpsCallable(functions, 'sendLoginEmail');
			await sendLogin({ email, callbackUrl, locale: $locale, captchaToken });
			try {
				localStorage.setItem('wishy-login-email', email);
			} catch {
				// Storage blocked: the callback page will ask for the email instead.
			}
			sent = true;
		} catch {
			error = $t('login.error');
		} finally {
			sending = false;
		}
	}

	function reset() {
		sent = false;
		error = '';
		// Turnstile tokens are single-use; remount the widget for a fresh one.
		captchaToken = '';
		engaged = false;
		queueMicrotask(() => input?.focus());
	}
</script>

{#if sent}
	<div
		class="bg-card border-2 border-success/40 rounded-2xl p-5 text-center animate-pop-in max-w-md mx-auto"
		role="status"
		aria-live="polite"
	>
		<span class="text-4xl block mb-2" aria-hidden="true">📬</span>
		<p class="font-extrabold text-text">{$t('landing.signup.sentTitle')}</p>
		<p class="text-sm text-text-soft mt-1">{$t('landing.signup.sentBody', { email })}</p>
		<button
			type="button"
			onclick={reset}
			class="mt-3 text-sm font-bold text-secondary-dark hover:text-primary underline underline-offset-4 decoration-2 decoration-secondary/40 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
		>
			{$t('landing.signup.retry')}
		</button>
	</div>
{:else}
	<form onsubmit={handleSubmit} class="w-full max-w-md mx-auto text-left">
		<label for={id} class="sr-only">{$t('login.email')}</label>
		<div
			class="flex flex-col sm:flex-row gap-2 sm:gap-1.5 sm:bg-card sm:rounded-full sm:border-2 sm:border-primary-light/40 sm:p-1.5 sm:shadow-lg sm:shadow-primary/10 sm:focus-within:border-primary transition-colors"
		>
			<input
				{id}
				bind:this={input}
				type="email"
				autocomplete="email"
				inputmode="email"
				required
				bind:value={email}
				onfocus={() => (engaged = true)}
				oninput={() => (engaged = true)}
				placeholder={$t('landing.signup.placeholder')}
				class="signup-input flex-1 min-w-0 rounded-full border-2 border-primary-light/40 sm:border-0 bg-card sm:bg-transparent px-5 py-3 text-base text-text placeholder:text-text-muted"
			/>
			<button
				type="submit"
				disabled={sending}
				class="shrink-0 font-bold bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-full text-base hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-dark"
			>
				{sending ? $t('login.sending') : $t('landing.signup.submit')}
			</button>
		</div>

		{#if engaged}
			<div class="max-w-xs mx-auto sm:mx-0">
				<Turnstile {onVerify} />
			</div>
		{/if}

		{#if error}
			<p class="text-sm font-semibold text-danger mt-2 text-center" role="alert">{error}</p>
		{/if}

		<ul class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs font-semibold text-text-soft">
			<li class="flex items-center gap-1"><span aria-hidden="true" class="text-success">✓</span>{$t('landing.signup.free')}</li>
			<li class="flex items-center gap-1"><span aria-hidden="true" class="text-success">✓</span>{$t('landing.signup.noPassword')}</li>
			<li class="flex items-center gap-1"><span aria-hidden="true" class="text-success">✓</span>{$t('landing.signup.fast')}</li>
		</ul>
	</form>
{/if}

<style>
	/* The global focus style adds a pink ring + border; inside the pill
	   on desktop the wrapper shows focus instead. */
	@media (min-width: 40rem) {
		.signup-input:focus {
			box-shadow: none !important;
		}
	}
</style>
