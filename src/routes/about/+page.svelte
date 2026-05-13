<script lang="ts">
	import { t } from '$lib/i18n';
	import { isLoggedIn } from '$lib/stores/auth';

	const sections = [
		{ icon: '💰', title: 'about.affiliate.title', body: 'about.affiliate.body' },
		{ icon: '🎯', title: 'about.pressure.title', body: 'about.pressure.body' },
		{ icon: '📱', title: 'about.influencer.title', body: 'about.influencer.body' },
		{ icon: '🔒', title: 'about.data.title', body: 'about.data.body' },
		{ icon: '👁️', title: 'about.visibility.title', body: 'about.visibility.body' }
	];
</script>

<div class="space-y-6 max-w-lg mx-auto">
	<div class="text-center">
		<h1 class="text-2xl font-extrabold text-text">{$t('about.title')}</h1>
		<p class="text-text-soft mt-1">{$t('about.intro')}</p>
	</div>

	{#each sections as section}
		<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm">
			<h2 class="text-lg font-bold text-text flex items-center gap-2">
				<span class="text-xl">{section.icon}</span>
				{$t(section.title)}
			</h2>
			<p class="text-text-soft mt-2 text-sm leading-relaxed">{$t(section.body)}</p>
		</div>
	{/each}

	<div class="bg-gradient-to-br from-primary-light/20 to-secondary-light/20 rounded-2xl border-2 border-primary/30 p-6 shadow-sm text-center">
		<h2 class="text-lg font-bold text-text flex items-center justify-center gap-2">
			<span class="text-xl">🎁</span>
			{$t('about.wishy.title')}
		</h2>
		<p class="text-text-soft mt-2 text-sm leading-relaxed">{$t('about.wishy.body')}</p>

		{#if !$isLoggedIn}
			<a
				href="/login"
				class="inline-block mt-4 font-bold bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
			>
				✨ {$t('about.cta')}
			</a>
		{/if}
	</div>
</div>
