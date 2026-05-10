<script lang="ts">
	import { userProfile, uploadPhoto, generateApiKey } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import AuthGuard from '$lib/components/AuthGuard.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	let uploadingPhoto = $state(false);
	let showApiKey = $state(false);
	let generatingKey = $state(false);
	let apiKeyCopied = $state(false);

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
			<div class="flex items-center gap-4">
				<label class="relative cursor-pointer group flex-shrink-0">
					{#if $userProfile?.photoUrl}
						<img
							src={$userProfile.photoUrl}
							alt="Profile"
							class="w-16 h-16 rounded-full object-cover border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors"
						/>
					{:else}
						<div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-secondary-light flex items-center justify-center text-2xl border-2 border-primary-light/40 group-hover:border-primary/50 transition-colors">
							{($userProfile?.displayName || $userProfile?.username || '?').charAt(0).toUpperCase()}
						</div>
					{/if}
					<div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
						<span class="text-white text-xs font-bold">{uploadingPhoto ? '...' : $t('profile.changePhoto')}</span>
					</div>
					<input
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handlePhotoChange}
						disabled={uploadingPhoto}
					/>
				</label>
				<div class="flex-1 min-w-0">
					<p class="font-bold text-text truncate">{$userProfile?.displayName || $userProfile?.username}</p>
					<p class="text-sm text-text-muted">@{$userProfile?.username}</p>
					<p class="text-xs text-text-muted">{$userProfile?.email}</p>
				</div>
			</div>
		</div>

		<!-- Language -->
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm flex items-center justify-between">
			<span class="font-bold text-text">{$t('settings.language')}</span>
			<LanguageSwitcher />
		</div>

		<!-- API key section -->
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 shadow-sm">
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
						<code class="block bg-surface/80 rounded-lg px-3 py-2 font-mono whitespace-pre-wrap break-all">POST {window.location.origin.replace('wish.lajlev.dk', 'us-central1-wishy-famille.cloudfunctions.net')}/addItem
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
	</div>
</AuthGuard>
