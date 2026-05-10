<script lang="ts">
	import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { auth, db } from '$lib/firebase';
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signOut } from '$lib/stores/auth';

	let error = $state('');
	let emailInput = $state('');
	let needsEmail = $state(false);

	$effect(() => {
		completeSignIn();
	});

	async function completeSignIn(overrideEmail?: string) {
		const href = window.location.href;
		if (!isSignInWithEmailLink(auth, href)) {
			error = $t('login.error');
			return;
		}

		let email = overrideEmail || localStorage.getItem('wishy-login-email');
		if (!email) {
			needsEmail = true;
			return;
		}

		try {
			const result = await signInWithEmailLink(auth, email, href);
			localStorage.removeItem('wishy-login-email');

			// Check if user is banned
			const userDoc = await getDoc(doc(db, 'users', result.user.uid));
			if (userDoc.exists() && userDoc.data().banned) {
				await signOut();
				error = $t('login.banned');
				return;
			}

			const redirect = page.url.searchParams.get('redirect') || '/';
			goto(redirect);
		} catch {
			error = $t('login.error');
		}
	}

	function handleEmailSubmit(e: Event) {
		e.preventDefault();
		if (emailInput.trim()) {
			needsEmail = false;
			completeSignIn(emailInput.trim());
		}
	}
</script>

<div class="max-w-sm mx-auto mt-16 text-center">
	{#if error}
		<p class="text-danger mb-4">{error}</p>
		<a href="/login" class="text-primary hover:underline">{$t('common.back')}</a>
	{:else if needsEmail}
		<h1 class="text-xl font-bold text-gray-900 mb-4">{$t('login.enterEmail')}</h1>
		<form onsubmit={handleEmailSubmit} class="space-y-4">
			<input
				type="email"
				bind:value={emailInput}
				required
				placeholder="din@email.dk"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
			/>
			<button
				type="submit"
				class="w-full bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-dark"
			>
				{$t('login.send')}
			</button>
		</form>
	{:else}
		<p class="text-gray-500">{$t('login.completing')}</p>
	{/if}
</div>
