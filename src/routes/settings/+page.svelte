<script lang="ts">
	import { userProfile, uploadPhoto, updateDisplayName, generateApiKey } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	let editingProfile = $state(false);
	let nameInput = $state('');
	let savingProfile = $state(false);
	let uploadingPhoto = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);

	let showAdvanced = $state(false);
	let showApiKey = $state(false);
	let generatingKey = $state(false);
	let apiKeyCopied = $state(false);

	function startEditingProfile() {
		nameInput = $userProfile?.displayName || '';
		photoFile = null;
		photoPreview = null;
		editingProfile = true;
	}

	function cancelEditingProfile() {
		editingProfile = false;
		photoFile = null;
		photoPreview = null;
	}

	function handlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		photoFile = file;
		photoPreview = URL.createObjectURL(file);
	}

	async function saveProfile() {
		const val = nameInput.trim();
		if (!val) return;
		savingProfile = true;
		try {
			await updateDisplayName(val);
			if (photoFile) {
				await uploadPhoto(photoFile);
			}
		} catch {
			// silently fail
		}
		savingProfile = false;
		editingProfile = false;
		photoFile = null;
		photoPreview = null;
	}

	async function handlePhotoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingPhoto = true;
		try {
			await uploadPhoto(file);
		} catch {
			// silently fail
		}
		uploadingPhoto = false;
		input.value = '';
	}

	async function handleGenerateApiKey() {
		generatingKey = true;
		await generateApiKey();
		generatingKey = false;
		showApiKey = true;
	}

	async function copyApiKey() {
		const key = $userProfile?.apiKey;
		if (!key) return;
		await navigator.clipboard.writeText(key);
		apiKeyCopied = true;
		setTimeout(() => (apiKeyCopied = false), 2000);
	}
</script>

<AuthGuard>
	<div class="space-y-6 max-w-lg mx-auto">
		<h1 class="text-2xl font-extrabold text-text">{$t('settings.title')}</h1>

		<!-- Profile section -->
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm">
			{#if editingProfile}
				<form onsubmit={(e) => { e.preventDefault(); saveProfile(); }} class="space-y-4">
					<div class="flex justify-center">
						<label class="relative cursor-pointer group">
							{#if photoPreview}
								<img
									src={photoPreview}
									alt="Profile"
									class="w-20 h-20 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
								/>
							{:else if $userProfile?.photoUrl}
								<img
									src={$userProfile.photoUrl}
									alt="Profile"
									class="w-20 h-20 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
								/>
							{:else}
								<div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-3xl border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors">
									{(nameInput || $userProfile?.username || '?').charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<span class="text-white text-xs font-bold">{$t('profile.changePhoto')}</span>
							</div>
							<input
								type="file"
								accept="image/*"
								class="hidden"
								onchange={handlePhotoSelect}
							/>
						</label>
					</div>

					<div>
						<label for="editName" class="block text-sm font-bold text-text mb-1.5">
							{$t('signup.name')}
						</label>
						<input
							id="editName"
							type="text"
							bind:value={nameInput}
							required
							maxlength="50"
							placeholder={$t('signup.namePlaceholder')}
							class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-3 text-sm text-text bg-surface/50 placeholder:text-text-muted"
						/>
					</div>

					<div class="flex gap-2">
						<button
							type="submit"
							disabled={!nameInput.trim() || savingProfile}
							class="flex-1 font-bold bg-gradient-to-r from-primary to-secondary text-white px-4 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
						>
							{savingProfile ? $t('username.saving') : $t('profile.save')}
						</button>
						<button
							type="button"
							onclick={cancelEditingProfile}
							class="font-semibold text-text-soft px-5 py-2.5 rounded-full text-sm border-2 border-primary-light/30 hover:bg-surface-dark transition-all active:scale-95"
						>
							{$t('wishlist.cancel')}
						</button>
					</div>
				</form>
			{:else}
				<div class="flex items-center gap-4">
					<div class="flex-shrink-0">
						{#if $userProfile?.photoUrl}
							<img
								src={$userProfile.photoUrl}
								alt="Profile"
								class="w-16 h-16 rounded-full object-cover border-2 border-primary-light/40"
							/>
						{:else}
							<div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-2xl border-2 border-primary-light/40">
								{($userProfile?.displayName || $userProfile?.username || '?').charAt(0).toUpperCase()}
							</div>
						{/if}
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-bold text-text truncate">{$userProfile?.displayName || $userProfile?.username}</p>
						<p class="text-sm text-text-muted">@{$userProfile?.username}</p>
						<p class="text-xs text-text-muted">{$userProfile?.email}</p>
					</div>
					<button
						onclick={startEditingProfile}
						class="flex-shrink-0 text-sm font-semibold text-text-soft hover:text-primary px-3 py-1.5 rounded-full border-2 border-primary-light/30 hover:border-primary/50 hover:bg-primary-light/10 transition-all active:scale-95"
					>
						{$t('profile.edit')}
					</button>
				</div>
			{/if}
		</div>

		<!-- Language -->
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm flex items-center justify-between">
			<span class="font-bold text-text">{$t('settings.language')}</span>
			<LanguageSwitcher />
		</div>

		<!-- Advanced settings toggle -->
		<button
			onclick={() => (showAdvanced = !showAdvanced)}
			class="flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors"
		>
			<span class="transition-transform duration-200 {showAdvanced ? 'rotate-90' : ''}">&rsaquo;</span>
			{$t('settings.advanced')}
		</button>

		{#if showAdvanced}
			<!-- API key section -->
			<div class="bg-card rounded-2xl border-2 border-primary-light/30 shadow-sm animate-pop-in">
				<div class="p-5 space-y-3">
					<h2 class="text-sm font-bold text-text">🔑 {$t('api.title')}</h2>
					<p class="text-xs text-text-muted">{$t('api.description')}</p>
					{#if $userProfile?.apiKey}
						<div class="flex items-center gap-2">
							<code class="flex-1 text-xs bg-surface/80 rounded-lg px-3 py-2 font-mono text-text-soft truncate">
								{showApiKey ? $userProfile.apiKey : '••••••••••••••••••••••••••••••••'}
							</code>
							<button
								onclick={() => (showApiKey = !showApiKey)}
								class="text-xs text-text-muted hover:text-text px-2 py-1"
							>
								{showApiKey ? $t('api.hide') : $t('api.show')}
							</button>
							<button
								onclick={copyApiKey}
								class="text-xs font-bold px-3 py-1.5 rounded-full border border-secondary/30 text-secondary hover:border-secondary hover:bg-secondary/10 transition-all"
							>
								{apiKeyCopied ? '✅' : $t('api.copy')}
							</button>
						</div>
						<button
							onclick={handleGenerateApiKey}
							disabled={generatingKey}
							class="text-xs text-text-muted hover:text-danger transition-colors"
						>
							{$t('api.regenerate')}
						</button>
					{:else}
						<button
							onclick={handleGenerateApiKey}
							disabled={generatingKey}
							class="text-sm font-bold px-4 py-2 rounded-full border-2 border-primary-light/30 text-primary hover:border-primary hover:bg-primary-light/20 transition-all active:scale-95"
						>
							{generatingKey ? '...' : $t('api.generate')}
						</button>
					{/if}
					{#if $userProfile?.apiKey}
						<div class="text-xs text-text-muted space-y-1 pt-1 border-t border-primary-light/20">
							<p class="font-semibold">{$t('api.usage')}</p>
							<code class="block bg-surface/80 rounded-lg px-3 py-2 font-mono whitespace-pre-wrap break-all">POST https://us-central1-wishy-famille.cloudfunctions.net/addItem
{`{
  "apiKey": "${showApiKey ? $userProfile.apiKey : '<your-key>'}",
  "name": "Cool thing",
  "url": "https://...",
  "price": 299,
  "currency": "DKK"
}`}</code>
						</div>
					{/if}
				</div>
			</div>

			<!-- Apple Shortcut tutorial -->
			{#if $userProfile?.apiKey}
				<div class="bg-card rounded-2xl border-2 border-primary-light/30 shadow-sm animate-pop-in">
					<div class="p-5 space-y-4">
						<h2 class="text-sm font-bold text-text">📱 {$t('shortcut.title')}</h2>
						<p class="text-xs text-text-muted">{$t('shortcut.intro')}</p>

						<ol class="space-y-4">
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
								<div>
									<p class="text-sm font-bold text-text">{$t('shortcut.step1.title')}</p>
									<p class="text-xs text-text-muted mt-0.5">{$t('shortcut.step1.desc')}</p>
								</div>
							</li>
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
								<div>
									<p class="text-sm font-bold text-text">{$t('shortcut.step2.title')}</p>
									<p class="text-xs text-text-muted mt-0.5">{$t('shortcut.step2.desc')}</p>
								</div>
							</li>
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
								<div>
									<p class="text-sm font-bold text-text">{$t('shortcut.step3.title')}</p>
									<p class="text-xs text-text-muted mt-0.5">{$t('shortcut.step3.desc')}</p>
								</div>
							</li>
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">4</span>
								<div>
									<p class="text-sm font-bold text-text">{$t('shortcut.step4.title')}</p>
									<p class="text-xs text-text-muted mt-0.5">{$t('shortcut.step4.desc')}</p>
									<div class="mt-2 bg-surface/80 rounded-lg px-3 py-2 space-y-1">
										<p class="text-xs font-mono text-text-soft">
											<span class="text-text-muted">{$t('shortcut.step4.url')}:</span>
											<span class="break-all">https://us-central1-wishy-famille.cloudfunctions.net/addItem</span>
										</p>
										<p class="text-xs font-mono text-text-soft">{$t('shortcut.step4.method')}</p>
										<p class="text-xs font-mono text-text-soft">{$t('shortcut.step4.body')}</p>
										<div class="border-t border-primary-light/20 pt-1 mt-1 space-y-0.5">
											<p class="text-xs font-mono text-text-soft">{$t('shortcut.step4.field.apiKey')}</p>
											<p class="text-xs font-mono text-text-soft">{$t('shortcut.step4.field.url')}</p>
										</div>
									</div>
								</div>
							</li>
							<li class="flex gap-3">
								<span class="flex-shrink-0 w-6 h-6 rounded-full bg-success text-white text-xs font-bold flex items-center justify-center mt-0.5">✓</span>
								<div>
									<p class="text-sm font-bold text-text">{$t('shortcut.step5.title')}</p>
									<p class="text-xs text-text-muted mt-0.5">{$t('shortcut.step5.desc')}</p>
								</div>
							</li>
						</ol>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</AuthGuard>
