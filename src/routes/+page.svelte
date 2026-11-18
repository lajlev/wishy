<script lang="ts">
	import { goto } from '$app/navigation';
	import { isLoading, isLoggedIn } from '$lib/stores/auth';
	import { t } from '$lib/i18n';

	// Logged-in users land on their own list (with friends panel);
	// /my-list handles profile setup if no username exists yet.
	$effect(() => {
		if (!$isLoading && $isLoggedIn) {
			goto('/my-list', { replaceState: true });
		}
	});

	const features = [
		{ icon: '💰', key: 'affiliate' },
		{ icon: '🚫', key: 'ads' },
		{ icon: '🎯', key: 'algorithms' },
		{ icon: '🤫', key: 'spoilers' },
		{ icon: '✨', key: 'autofill' },
		{ icon: '👯', key: 'friends' }
	];

	const steps = ['landing.step1', 'landing.step2', 'landing.step3'];
</script>

{#if $isLoading || $isLoggedIn}
	<div class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
		<span class="text-5xl animate-float">🎁</span>
		<div class="flex gap-1.5">
			<span class="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style="animation-delay: 0s"></span>
			<span class="w-2.5 h-2.5 bg-secondary rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
			<span class="w-2.5 h-2.5 bg-accent rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
		</div>
	</div>
{:else}
	<div class="space-y-12 py-4">
		<!-- Hero -->
		<section class="text-center space-y-5">
			<span class="text-6xl block animate-float">🎁</span>
			<p class="inline-block text-xs font-bold text-secondary-dark bg-secondary/10 border-2 border-secondary/20 rounded-full px-3 py-1">
				{$t('landing.badge')}
			</p>
			<h1 class="text-3xl sm:text-4xl font-extrabold text-text leading-tight max-w-xl mx-auto">
				{$t('landing.title')}
			</h1>
			<p class="text-text-soft text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
				{$t('landing.subtitle')}
			</p>
			<div class="flex flex-col items-center gap-2 pt-2">
				<a
					href="/login"
					class="inline-block font-bold bg-gradient-to-r from-primary to-secondary text-white px-8 py-3.5 rounded-full text-base hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
				>
					✨ {$t('landing.cta')}
				</a>
				<p class="text-xs text-text-muted">{$t('landing.ctaHint')}</p>
			</div>
		</section>

		<!-- Value propositions -->
		<section class="space-y-4">
			<h2 class="text-xl font-extrabold text-text text-center">{$t('landing.valuesTitle')}</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{#each features as feature (feature.key)}
					<div class="bg-card rounded-2xl border-2 border-primary-light/30 p-5 shadow-sm">
						<h3 class="font-bold text-text flex items-center gap-2">
							<span class="text-xl">{feature.icon}</span>
							{$t(`landing.feature.${feature.key}.title`)}
						</h3>
						<p class="text-text-soft mt-1.5 text-sm leading-relaxed">{$t(`landing.feature.${feature.key}.body`)}</p>
					</div>
				{/each}
			</div>
			<p class="text-center">
				<a href="/about" class="text-sm font-bold text-secondary hover:text-secondary-dark transition-colors">
					{$t('landing.learnMore')} →
				</a>
			</p>
		</section>

		<!-- How it works -->
		<section class="space-y-4">
			<h2 class="text-xl font-extrabold text-text text-center">{$t('landing.howTitle')}</h2>
			<ol class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{#each steps as step, i (step)}
					<li class="flex sm:flex-col items-center sm:text-center gap-3 bg-card rounded-2xl border-2 border-primary-light/30 p-4 shadow-sm">
						<span class="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-white font-extrabold flex items-center justify-center">
							{i + 1}
						</span>
						<p class="text-sm font-semibold text-text">{$t(step)}</p>
					</li>
				{/each}
			</ol>
		</section>

		<!-- Final CTA -->
		<section class="bg-gradient-to-br from-primary-light/20 to-secondary-light/20 rounded-2xl border-2 border-primary/30 p-6 shadow-sm text-center">
			<h2 class="text-lg font-bold text-text">{$t('landing.finalTitle')}</h2>
			<p class="text-text-soft mt-1 text-sm">{$t('landing.finalBody')}</p>
			<a
				href="/login"
				class="inline-block mt-4 font-bold bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-full text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
			>
				✨ {$t('landing.cta')}
			</a>
		</section>
	</div>
{/if}
