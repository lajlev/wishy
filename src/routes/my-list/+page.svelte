<script lang="ts">
	import { goto } from '$app/navigation';
	import { db } from '$lib/firebase';
	import {
		user, userProfile, hasUsername, checkUsernameAvailable, claimUsername, uploadPhoto
	} from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import AuthGuard from '$lib/components/AuthGuard.svelte';

	let nameInput = $state('');
	let usernameInput = $state('');
	let usernameError = $state('');
	let checkingUsername = $state(false);
	let savingUsername = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);

	const usernamePattern = /^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/;

	$effect(() => {
		const profile = $userProfile;
		if (profile?.username) {
			goto(`/lists/${profile.username}`, { replaceState: true });
		}
	});

	async function validateUsername() {
		const val = usernameInput.toLowerCase().trim();
		usernameInput = val;
		usernameError = '';

		if (!val) return;
		if (val.length < 3) {
			usernameError = $t('username.tooShort');
			return;
		}
		if (!usernamePattern.test(val)) {
			usernameError = $t('username.invalid');
			return;
		}

		checkingUsername = true;
		const available = await checkUsernameAvailable(val);
		checkingUsername = false;

		if (!available) {
			usernameError = $t('username.taken');
		}
	}

	function handlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoFile = file;
		photoPreview = URL.createObjectURL(file);
	}

	async function handleClaimUsername(e: Event) {
		e.preventDefault();
		const val = usernameInput.toLowerCase().trim();
		const name = nameInput.trim();
		if (!val || !name || usernameError || !usernamePattern.test(val)) return;

		savingUsername = true;
		try {
			await claimUsername(val, name);
			if (photoFile) {
				await uploadPhoto(photoFile);
			}
		} catch {
			usernameError = $t('common.error');
		}
		savingUsername = false;
	}
</script>

<AuthGuard>
	{#if !$hasUsername}
		<div class="max-w-md mx-auto">
			<div class="text-center mb-6">
				<span class="text-4xl block mb-2">👋</span>
				<h1 class="text-2xl font-extrabold text-text">{$t('signup.title')}</h1>
				<p class="text-text-soft mt-2">{$t('signup.subtitle')}</p>
			</div>

			<form onsubmit={handleClaimUsername} class="space-y-5 bg-card rounded-2xl border-2 border-primary-light/30 p-6 shadow-lg shadow-primary/5">
				<!-- Profile photo -->
				<div class="flex justify-center">
					<label class="relative cursor-pointer group">
						{#if photoPreview}
							<img
								src={photoPreview}
								alt="Profile"
								class="w-20 h-20 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
							/>
						{:else}
							<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-3xl border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors">
								📷
							</div>
						{/if}
						<div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
							<span class="text-white text-xs font-bold">{photoPreview ? $t('signup.photoChange') : $t('signup.photoAdd')}</span>
						</div>
						<input
							type="file"
							accept="image/*"
							class="hidden"
							onchange={handlePhotoSelect}
						/>
					</label>
				</div>

				<!-- Name -->
				<div>
					<label for="displayName" class="block text-sm font-bold text-text mb-1.5">
						{$t('signup.name')}
					</label>
					<input
						id="displayName"
						type="text"
						bind:value={nameInput}
						required
						maxlength="50"
						placeholder={$t('signup.namePlaceholder')}
						class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted"
					/>
				</div>

				<!-- Username -->
				<div>
					<label for="username" class="block text-sm font-bold text-text mb-1.5">
						{$t('username.label')}
					</label>
					<div class="flex items-center gap-2">
						<span class="text-sm text-text-muted font-mono">wish.lajlev.dk/lists/</span>
						<input
							id="username"
							type="text"
							bind:value={usernameInput}
							oninput={validateUsername}
							required
							minlength="3"
							maxlength="20"
							pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
							placeholder="michael"
							class="flex-1 rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted font-mono"
						/>
					</div>
					{#if checkingUsername}
						<p class="text-xs text-text-muted mt-1">{$t('username.checking')}</p>
					{:else if usernameError}
						<p class="text-xs text-danger mt-1">{usernameError}</p>
					{:else if usernameInput.length >= 3 && usernamePattern.test(usernameInput)}
						<p class="text-xs text-success mt-1">{$t('username.available')}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={!nameInput.trim() || !usernameInput.trim() || !!usernameError || checkingUsername || savingUsername || !usernamePattern.test(usernameInput)}
					class="w-full font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-3 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
				>
					{savingUsername ? $t('username.saving') : $t('username.save')}
				</button>
			</form>
		</div>
	{/if}
</AuthGuard>
