<script lang="ts">
	import { httpsCallable } from 'firebase/functions';
	import { functions } from '$lib/firebase';
	import { t } from '$lib/i18n';

	let {
		initialName = '',
		initialUrl = '',
		initialPrice = '',
		initialCurrency = 'DKK',
		initialImageUrl = '',
		initialNotes = '',
		onsave,
		oncancel
	}: {
		initialName?: string;
		initialUrl?: string;
		initialPrice?: string;
		initialCurrency?: string;
		initialImageUrl?: string;
		initialNotes?: string;
		onsave: (data: {
			name: string;
			url: string;
			price: number | null;
			currency: string;
			imageUrl: string;
			notes: string;
		}) => void;
		oncancel?: () => void;
	} = $props();

	const isEditing = !!(initialName || initialUrl);

	let name = $state(initialName);
	let url = $state(initialUrl);
	let price = $state(initialPrice);
	let currency = $state(initialCurrency);
	let imageUrl = $state(initialImageUrl);
	let notes = $state(initialNotes);
	let saving = $state(false);

	let fetching = $state(false);
	let scrapeStage = $state(0);
	let showFields = $state(isEditing);
	let candidateImages = $state<string[]>([]);
	let scrapeError = $state(false);

	let urlDebounceTimer: ReturnType<typeof setTimeout>;
	let stageTimer: ReturnType<typeof setInterval>;

	const scrapeUrlFn = httpsCallable<{ url: string }, {
		name: string | null;
		description: string | null;
		images: string[];
		price: string | null;
		currency: string | null;
		notes: string | null;
		siteName: string | null;
	}>(functions, 'scrapeUrl');

	const stageEmojis = ['🌐', '📸', '🤖', '✨'];

	function handleUrlInput() {
		clearTimeout(urlDebounceTimer);
		if (!url || !url.startsWith('http')) return;

		urlDebounceTimer = setTimeout(async () => {
			fetching = true;
			scrapeError = false;
			scrapeStage = 0;

			stageTimer = setInterval(() => {
				if (scrapeStage < 3) scrapeStage++;
			}, 1800);

			try {
				const result = await scrapeUrlFn({ url });
				const data = result.data;

				if (data.name && !name) name = data.name;
				if (data.price && !price) {
					const cleaned = String(data.price).replace(/[^\d.,]/g, '').replace(',', '.');
					const parsed = parseFloat(cleaned);
					if (!isNaN(parsed)) price = String(parsed);
				}
				if (data.currency) currency = data.currency;
				if (data.notes && !notes) notes = data.notes;

				if (data.images?.length) {
					candidateImages = data.images;
					if (!imageUrl) imageUrl = data.images[0];
				}
			} catch {
				scrapeError = true;
			} finally {
				clearInterval(stageTimer);
				fetching = false;
				scrapeStage = 0;
				showFields = true;
			}
		}, 600);
	}

	function skipToManual() {
		showFields = true;
	}

	function selectImage(src: string) {
		imageUrl = src;
	}

	function clearForm() {
		name = '';
		url = '';
		price = '';
		currency = 'DKK';
		imageUrl = '';
		notes = '';
		candidateImages = [];
		showFields = false;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		saving = true;
		onsave({
			name: name.trim(),
			url: url.trim() || '',
			price: price ? parseFloat(price) : null,
			currency,
			imageUrl: imageUrl.trim() || '',
			notes: notes.trim()
		});
	}
</script>

<form onsubmit={handleSubmit} class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm animate-pop-in">
	<!-- URL input — always visible -->
	<div>
		<label for="url" class="block text-sm font-bold text-text mb-1">🔗 {$t('item.link')}</label>
		<input
			id="url"
			type="url"
			bind:value={url}
			oninput={handleUrlInput}
			placeholder={$t('item.linkPlaceholder')}
			class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50 placeholder:text-text-muted"
		/>
	</div>

	<!-- Scraping animation -->
	{#if fetching}
		<div class="flex flex-col items-center py-8 gap-4">
			<div class="relative">
				<span class="text-5xl block animate-bounce" style="animation-duration: 0.8s">
					{stageEmojis[scrapeStage]}
				</span>
				<span class="absolute -right-2 -top-1 text-lg animate-ping opacity-70">✨</span>
			</div>

			<div class="text-center">
				<p class="text-sm font-bold text-text animate-pulse">
					{#if scrapeStage === 0}
						{$t('item.scrapeStage1')}
					{:else if scrapeStage === 1}
						{$t('item.scrapeStage2')}
					{:else if scrapeStage === 2}
						{$t('item.scrapeStage3')}
					{:else}
						{$t('item.scrapeStage4')}
					{/if}
				</p>
			</div>

			<div class="flex gap-2">
				{#each [0, 1, 2, 3] as i}
					<div
						class="h-1.5 w-8 rounded-full transition-all duration-500 {i <= scrapeStage ? 'bg-primary' : 'bg-primary-light/30'}"
					></div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Manual entry link — shown when not fetching and fields are hidden -->
	{#if !fetching && !showFields}
		<button
			type="button"
			onclick={skipToManual}
			class="block mt-3 text-xs font-semibold text-text-muted hover:text-primary transition-colors"
		>
			{$t('item.addManually')}
		</button>
	{/if}

	<!-- Fields — revealed after scrape or manual click -->
	{#if showFields && !fetching}
		<div class="space-y-4 mt-4 animate-pop-in">
			<!-- Image picker -->
			{#if candidateImages.length > 1}
				<div>
					<p class="text-sm font-bold text-text mb-2">📸 {$t('item.pickImage')}</p>
					<div class="flex gap-2 overflow-x-auto py-2 -mx-2 px-2 snap-x">
						{#each candidateImages as src (src)}
							<button
								type="button"
								onclick={() => selectImage(src)}
								class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-3 transition-all snap-start {imageUrl === src ? 'border-primary shadow-md shadow-primary/20 scale-105' : 'border-transparent hover:border-primary-light opacity-70 hover:opacity-100'}"
							>
								<img
									{src}
									alt=""
									class="w-full h-full object-cover"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = 'none'; }}
								/>
							</button>
						{/each}
					</div>
				</div>
			{:else if imageUrl}
				<div>
					<p class="text-sm font-bold text-text mb-1">📸 Preview</p>
					<img src={imageUrl} alt="Preview" class="w-24 h-24 object-cover rounded-xl border-2 border-primary-light/30" />
				</div>
			{/if}

			<div>
				<label for="name" class="block text-sm font-bold text-text mb-1">🏷️ {$t('item.name')}</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					placeholder={$t('item.namePlaceholder')}
					class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50 placeholder:text-text-muted"
				/>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="price" class="block text-sm font-bold text-text mb-1">💰 {$t('item.price')}</label>
					<input
						id="price"
						type="number"
						step="0.01"
						min="0"
						bind:value={price}
						placeholder={$t('item.pricePlaceholder')}
						class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50 placeholder:text-text-muted"
					/>
				</div>
				<div>
					<label for="currency" class="block text-sm font-bold text-text mb-1">{$t('item.currency')}</label>
					<select
						id="currency"
						bind:value={currency}
						class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50"
					>
						<option value="DKK">DKK</option>
						<option value="EUR">EUR</option>
						<option value="USD">USD</option>
						<option value="GBP">GBP</option>
						<option value="SEK">SEK</option>
						<option value="NOK">NOK</option>
					</select>
				</div>
			</div>

			<div>
				<label for="notes" class="block text-sm font-bold text-text mb-1">📝 {$t('item.notes')}</label>
				<textarea
					id="notes"
					bind:value={notes}
					placeholder={$t('item.notesPlaceholder')}
					rows="2"
					class="w-full rounded-xl border-2 border-primary-light/30 px-4 py-2.5 text-sm text-text bg-surface/50 placeholder:text-text-muted"
				></textarea>
			</div>

			<div class="flex gap-2">
				<button
					type="submit"
					disabled={!name.trim() || saving}
					class="font-bold bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
				>
					{saving ? $t('item.saving') : `✨ ${$t('item.save')}`}
				</button>
				{#if oncancel}
					<button
						type="button"
						onclick={oncancel}
						class="font-semibold text-text-soft px-5 py-2.5 rounded-full text-sm border-2 border-primary-light/30 hover:bg-surface-dark transition-all active:scale-95"
					>
						{$t('wishlist.cancel')}
					</button>
				{/if}
				{#if !isEditing}
					<button
						type="button"
						onclick={clearForm}
						class="ml-auto text-xs font-semibold text-text-muted hover:text-primary transition-colors"
					>
						{$t('item.clear')}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</form>
