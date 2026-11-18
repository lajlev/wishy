<script lang="ts">
	import type { Component } from 'svelte';
	import { goto } from '$app/navigation';
	import { isLoading, isLoggedIn } from '$lib/stores/auth';
	import { t } from '$lib/i18n';
	import SignupForm from '$lib/components/SignupForm.svelte';
	import EnvelopeIllustration from '$lib/components/illustrations/EnvelopeIllustration.svelte';
	import WishlistIllustration from '$lib/components/illustrations/WishlistIllustration.svelte';
	import ShareIllustration from '$lib/components/illustrations/ShareIllustration.svelte';
	import SecretIllustration from '$lib/components/illustrations/SecretIllustration.svelte';
	import HeroIllustration from '$lib/components/illustrations/HeroIllustration.svelte';
	import FeatureIcon, { type FeatureIconName } from '$lib/components/illustrations/FeatureIcon.svelte';

	// Logged-in users land on their own list (with friends panel);
	// /my-list handles profile setup if no username exists yet.
	$effect(() => {
		if (!$isLoading && $isLoggedIn) {
			goto('/my-list', { replaceState: true });
		}
	});

	const steps: { key: string; art: Component }[] = [
		{ key: 'step1', art: EnvelopeIllustration },
		{ key: 'step2', art: WishlistIllustration },
		{ key: 'step3', art: ShareIllustration },
		{ key: 'step4', art: SecretIllustration }
	];

	const features: { key: FeatureIconName }[] = [
		{ key: 'affiliate' },
		{ key: 'ads' },
		{ key: 'algorithms' },
		{ key: 'spoilers' },
		{ key: 'guests' },
		{ key: 'friends' }
	];

	// Every competitor cell is backed by a public source from Ønskeskyen/GoWish
	// themselves (terms of use, support articles, partner site), checked
	// November 2026. Rows we couldn't verify are left out on purpose.
	type Cell = { yes: boolean; detail?: string };
	const comparison: { key: string; wishy: Cell; other: Cell }[] = [
		{ key: 'free', wishy: { yes: true }, other: { yes: true } },
		{ key: 'reserve', wishy: { yes: true }, other: { yes: true } },
		{
			key: 'guestReserve',
			wishy: { yes: true, detail: 'landing.compare.row.guestReserve.wishy' },
			other: { yes: false, detail: 'landing.compare.row.guestReserve.other' }
		},
		{
			key: 'anyShop',
			wishy: { yes: true, detail: 'landing.compare.row.anyShop.wishy' },
			other: { yes: true, detail: 'landing.compare.row.anyShop.other' }
		},
		{ key: 'apps', wishy: { yes: false, detail: 'landing.compare.row.apps.wishy' }, other: { yes: true } },
		{ key: 'affiliate', wishy: { yes: false }, other: { yes: true, detail: 'landing.compare.row.affiliate.other' } },
		{ key: 'sponsored', wishy: { yes: false }, other: { yes: true, detail: 'landing.compare.row.sponsored.other' } },
		{ key: 'brands', wishy: { yes: false }, other: { yes: true, detail: 'landing.compare.row.brands.other' } },
		{
			key: 'search',
			wishy: { yes: false, detail: 'landing.compare.row.search.wishy' },
			other: { yes: true, detail: 'landing.compare.row.search.other' }
		}
	];

	const faq = ['cost', 'guests', 'secret', 'undo', 'shops'];
</script>

{#snippet cell(c: Cell)}
	<span class="inline-flex items-center gap-1.5 font-extrabold text-text">
		{#if c.yes}
			<span aria-hidden="true" class="grid place-items-center w-5 h-5 rounded-full bg-success/20 text-[#047857] text-xs">✓</span>
		{:else}
			<span aria-hidden="true" class="grid place-items-center w-5 h-5 rounded-full bg-text-muted/15 text-text-soft text-xs">✕</span>
		{/if}
		{c.yes ? $t('landing.compare.yes') : $t('landing.compare.no')}
	</span>
	{#if c.detail}
		<span class="block text-xs font-medium text-text-soft mt-0.5 leading-snug">{$t(c.detail)}</span>
	{/if}
{/snippet}

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
	<div class="space-y-16 sm:space-y-20 py-4">
		<!-- Hero with inline signup -->
		<section class="text-center space-y-5" aria-labelledby="hero-title">
			<div class="w-56 sm:w-72 mx-auto aspect-[8/5] animate-float">
				<HeroIllustration />
			</div>
			<p class="inline-block text-xs font-bold text-secondary-dark bg-secondary/10 border-2 border-secondary/20 rounded-full px-3 py-1">
				{$t('landing.badge')}
			</p>
			<h1 id="hero-title" class="text-3xl sm:text-5xl font-extrabold text-text leading-[1.1] tracking-tight max-w-xl mx-auto text-balance">
				{$t('landing.title')}
			</h1>
			<p class="text-text-soft text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
				{$t('landing.subtitle')}
			</p>
			<div class="pt-2">
				<SignupForm id="signup-hero" />
			</div>
			<p class="text-xs font-semibold text-text-muted">{$t('landing.heroNote')}</p>
		</section>

		<!-- How it works -->
		<section class="space-y-8" aria-labelledby="how-title">
			<div class="text-center space-y-1.5">
				<h2 id="how-title" class="text-2xl font-extrabold text-text">{$t('landing.howTitle')}</h2>
				<p class="text-text-soft">{$t('landing.howIntro')}</p>
			</div>
			<div class="relative">
			<!-- dotted trail linking the steps on wide screens -->
			<div aria-hidden="true" class="hidden md:block absolute left-[12%] right-[12%] top-[3.75rem] border-t-[3px] border-dotted border-secondary/40"></div>
			<ol class="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
				{#each steps as step, i (step.key)}
					{@const Art = step.art}
					<li class="relative flex sm:flex-col items-center gap-4 sm:gap-3 sm:text-center">
						<div class="relative shrink-0 w-28 sm:w-40 aspect-[4/3]">
							<Art />
							<span
								aria-hidden="true"
								class="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm font-extrabold grid place-items-center ring-4 ring-surface"
							>{i + 1}</span>
						</div>
						<div>
							<h3 class="font-extrabold text-text">
								<span class="sr-only">{i + 1}. </span>{$t(`landing.${step.key}.title`)}
							</h3>
							<p class="text-sm text-text-soft leading-relaxed mt-1 max-w-[30ch] sm:mx-auto">{$t(`landing.${step.key}.body`)}</p>
						</div>
					</li>
				{/each}
			</ol>
			</div>
		</section>

		<!-- Why Wishy is different -->
		<section class="space-y-5" aria-labelledby="values-title">
			<h2 id="values-title" class="text-2xl font-extrabold text-text text-center">{$t('landing.valuesTitle')}</h2>
			<div class="bg-card rounded-3xl border-2 border-primary-light/30 shadow-sm overflow-hidden">
				<ul class="grid grid-cols-1 sm:grid-cols-2">
					{#each features as feature, i (feature.key)}
						<li
							class="flex gap-3.5 p-5 border-primary-light/25 {i > 0 ? 'border-t-2' : ''} {i === 1 ? 'sm:border-t-0' : ''} {i % 2 === 1 ? 'sm:border-l-2' : ''}"
						>
							<span aria-hidden="true" class="shrink-0 w-14 h-14 p-1.5 rounded-2xl bg-gradient-to-br from-primary-light/30 to-secondary/20">
								<FeatureIcon name={feature.key} />
							</span>
							<div>
								<h3 class="font-bold text-text">{$t(`landing.feature.${feature.key}.title`)}</h3>
								<p class="text-text-soft mt-1 text-sm leading-relaxed">{$t(`landing.feature.${feature.key}.body`)}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
			<p class="text-center">
				<a href="/about" class="text-sm font-bold text-secondary-dark hover:text-primary underline underline-offset-4 decoration-2 decoration-secondary/40 transition-colors">
					{$t('landing.learnMore')}
				</a>
			</p>
		</section>

		<!-- Comparison -->
		<section class="space-y-5" aria-labelledby="compare-title">
			<div class="text-center space-y-1.5">
				<h2 id="compare-title" class="text-2xl font-extrabold text-text">{$t('landing.compare.title')}</h2>
				<p class="text-text-soft max-w-lg mx-auto text-sm sm:text-base leading-relaxed">{$t('landing.compare.intro')}</p>
			</div>
			<div class="overflow-x-auto rounded-3xl border-2 border-primary-light/30 bg-card shadow-sm">
				<table class="w-full text-[13px] sm:text-sm text-left border-collapse hyphens-auto [overflow-wrap:break-word]">
					<thead>
						<tr class="border-b-2 border-primary-light/25">
							<th scope="col" class="p-2.5 sm:p-4 font-bold text-text-soft w-[40%]">{$t('landing.compare.feature')}</th>
							<th scope="col" class="p-2.5 sm:p-4 font-extrabold text-white bg-gradient-to-br from-primary to-secondary w-[30%]">Wishy</th>
							<th scope="col" class="p-2.5 sm:p-4 font-bold text-text w-[30%]">{$t('landing.compare.other')}</th>
						</tr>
					</thead>
					<tbody>
						{#each comparison as row, i (row.key)}
							<tr class={i > 0 ? 'border-t-2 border-primary-light/20' : ''}>
								<th scope="row" class="p-2.5 sm:p-4 font-semibold text-text align-top">{$t(`landing.compare.row.${row.key}`)}</th>
								<td class="p-2.5 sm:p-4 align-top bg-primary-light/10">{@render cell(row.wishy)}</td>
								<td class="p-2.5 sm:p-4 align-top">{@render cell(row.other)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<p class="text-xs text-text-muted text-center">{$t('landing.compare.footnote')}</p>
		</section>

		<!-- FAQ -->
		<section class="space-y-5" aria-labelledby="faq-title">
			<h2 id="faq-title" class="text-2xl font-extrabold text-text text-center">{$t('landing.faq.title')}</h2>
			<div class="bg-card rounded-3xl border-2 border-primary-light/30 shadow-sm divide-y-2 divide-primary-light/20">
				{#each faq as key (key)}
					<details class="group px-5 py-4">
						<summary
							class="flex items-center justify-between gap-4 cursor-pointer list-none font-bold text-text rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary [&::-webkit-details-marker]:hidden"
						>
							{$t(`landing.faq.${key}.q`)}
							<span
								aria-hidden="true"
								class="shrink-0 grid place-items-center w-7 h-7 rounded-full bg-secondary/15 text-secondary-dark font-extrabold transition-transform group-open:rotate-45"
							>+</span>
						</summary>
						<p class="text-sm text-text-soft leading-relaxed mt-2 pr-10">{$t(`landing.faq.${key}.a`)}</p>
					</details>
				{/each}
			</div>
		</section>

		<!-- Final CTA -->
		<section
			class="bg-gradient-to-br from-primary-light/25 to-secondary/15 rounded-3xl border-2 border-primary/25 px-5 py-8 sm:p-10 text-center space-y-4"
			aria-labelledby="final-title"
		>
			<div>
				<h2 id="final-title" class="text-2xl font-extrabold text-text">{$t('landing.finalTitle')}</h2>
				<p class="text-text-soft mt-1">{$t('landing.finalBody')}</p>
			</div>
			<SignupForm id="signup-final" />
		</section>
	</div>
{/if}
