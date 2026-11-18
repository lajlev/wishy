<!-- Small kawaii icons for the "Why Wishy is different" value cards.
     Same palette and outline as the how-it-works illustrations. -->
<script lang="ts" module>
	export type FeatureIconName = 'affiliate' | 'ads' | 'algorithms' | 'spoilers' | 'guests' | 'friends';
</script>

<script lang="ts">
	let { name }: { name: FeatureIconName } = $props();
</script>

{#snippet noBadge()}
	<!-- gentle "no" badge, bottom right -->
	<circle cx="49" cy="49" r="10" fill="#fff" stroke="#2e1065" stroke-width="3" />
	<path d="M42.5 42.5l13 13" stroke="#e8567f" stroke-width="3.5" stroke-linecap="round" />
{/snippet}

<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="w-full h-full">
	{#if name === 'affiliate'}
		<!-- happy money bag, politely declined -->
		<path d="M21 9q5.5 4 11 0 5.5 4 11 0l-5 13H26z" fill="#fde68a" stroke="#2e1065" stroke-width="3" stroke-linejoin="round" />
		<path d="M25 22c-9 5-16 13-16 21 0 7 5 11 12 11h22c7 0 12-4 12-11 0-8-7-16-16-21z" fill="#fde68a" stroke="#2e1065" stroke-width="3.5" stroke-linejoin="round" />
		<rect x="23" y="19.5" width="18" height="6" rx="3" fill="#e8567f" stroke="#2e1065" stroke-width="3" />
		<circle cx="24.5" cy="38" r="2.4" fill="#2e1065" />
		<circle cx="37.5" cy="38" r="2.4" fill="#2e1065" />
		<path d="M28 42.5q3 3 6 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<ellipse cx="18.5" cy="43.5" rx="3.2" ry="2" fill="#e8567f" fill-opacity="0.45" />
		<ellipse cx="43" cy="43" rx="3" ry="2" fill="#e8567f" fill-opacity="0.45" />
		<path d="M53 9l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#fbbf24" />
		{@render noBadge()}
	{:else if name === 'ads'}
		<!-- sweet megaphone that has gone quiet -->
		<path d="M18 36l4 15a2 2 0 002 1.5h4.5l-3.5-15" fill="#f9a8c4" stroke="#2e1065" stroke-width="3" stroke-linejoin="round" />
		<path d="M14 25h8l20-11v36L22 39h-8a5 5 0 01-5-5v-4a5 5 0 015-5z" fill="#a78bfa" stroke="#2e1065" stroke-width="3.5" stroke-linejoin="round" />
		<ellipse cx="44" cy="32" rx="5" ry="18" fill="#c4b5fd" stroke="#2e1065" stroke-width="3.5" />
		<path d="M20 30q2.5-2.5 5 0M29.5 30q2.5-2.5 5 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<path d="M24.5 35.5q2.5 2 5 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<ellipse cx="17.5" cy="35" rx="2.6" ry="1.7" fill="#e8567f" fill-opacity="0.55" />
		<path d="M55 11l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#fbbf24" />
		{@render noBadge()}
	{:else if name === 'algorithms'}
		<!-- friendly robot, kindly switched off -->
		<path d="M27 17V10" stroke="#2e1065" stroke-width="3" stroke-linecap="round" />
		<path d="M27 4.5c-1.4-2-4.6-1.2-4.6 1.2 0 2.1 2.4 3.5 4.6 5 2.2-1.5 4.6-2.9 4.6-5 0-2.4-3.2-3.2-4.6-1.2z" fill="#e8567f" stroke="#2e1065" stroke-width="2.4" stroke-linejoin="round" />
		<rect x="4" y="27" width="6" height="12" rx="3" fill="#f9a8c4" stroke="#2e1065" stroke-width="3" />
		<rect x="44" y="27" width="6" height="12" rx="3" fill="#f9a8c4" stroke="#2e1065" stroke-width="3" />
		<rect x="9" y="17" width="36" height="31" rx="10" fill="#c4b5fd" stroke="#2e1065" stroke-width="3.5" />
		<rect x="15" y="23" width="24" height="17" rx="6" fill="#fff" stroke="#2e1065" stroke-width="3" />
		<path d="M19.5 31q2.5-2.5 5 0M29.5 31q2.5-2.5 5 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<path d="M24.5 35q2.5 2 5 0" stroke="#2e1065" stroke-width="2.2" stroke-linecap="round" />
		<ellipse cx="19" cy="36" rx="2" ry="1.3" fill="#e8567f" fill-opacity="0.55" />
		<ellipse cx="35" cy="36" rx="2" ry="1.3" fill="#e8567f" fill-opacity="0.55" />
		<path d="M54 10l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#fbbf24" />
		{@render noBadge()}
	{:else if name === 'spoilers'}
		<!-- gift keeping the secret -->
		<rect x="9" y="30" width="38" height="27" rx="6" fill="#a78bfa" stroke="#2e1065" stroke-width="3.5" />
		<rect x="5" y="22" width="46" height="11" rx="4.5" fill="#c4b5fd" stroke="#2e1065" stroke-width="3.5" />
		<path d="M28 22v11" stroke="#2e1065" stroke-width="3.5" />
		<path d="M28 22c-4-9-14-9-12.5-2.5C16.8 23 23 22 28 22zM28 22c4-9 14-9 12.5-2.5C39.2 23 33 22 28 22z" fill="#e8567f" stroke="#2e1065" stroke-width="3" stroke-linejoin="round" />
		<path d="M16 42q3-3 6 0M34 42q3-3 6 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<circle cx="28" cy="49" r="2.4" fill="#2e1065" />
		<ellipse cx="15" cy="48" rx="3" ry="2" fill="#e8567f" fill-opacity="0.6" />
		<ellipse cx="41" cy="48" rx="3" ry="2" fill="#e8567f" fill-opacity="0.6" />
		<!-- shh bubble -->
		<path d="M46 2h9a6 6 0 016 6v2a6 6 0 01-6 6h-4l-5 4v-4.3A6 6 0 0140 10V8a6 6 0 016-6z" fill="#fff" stroke="#2e1065" stroke-width="2.6" stroke-linejoin="round" />
		<circle cx="46" cy="9" r="1.7" fill="#e8567f" />
		<circle cx="50.5" cy="9" r="1.7" fill="#a78bfa" />
		<circle cx="55" cy="9" r="1.7" fill="#2e1065" />
		<path d="M57 34l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#fbbf24" />
	{:else if name === 'guests'}
		<!-- grandma, no password needed -->
		<circle cx="32" cy="11" r="6" fill="#ede9fe" stroke="#2e1065" stroke-width="3" />
		<circle cx="32" cy="36" r="18" fill="#fde68a" stroke="#2e1065" stroke-width="3.5" />
		<path d="M14.5 33.5C14.5 23.5 22 18 32 18s17.5 5.5 17.5 15.5C44.5 33 38.5 30 32 25c-6.5 5-12.5 8-17.5 8.5z" fill="#ede9fe" stroke="#2e1065" stroke-width="3" stroke-linejoin="round" />
		<circle cx="25" cy="39" r="5" fill="#fff" fill-opacity="0.6" stroke="#2e1065" stroke-width="2.4" />
		<circle cx="39" cy="39" r="5" fill="#fff" fill-opacity="0.6" stroke="#2e1065" stroke-width="2.4" />
		<path d="M30 39h4" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<path d="M23 40q2-2 4 0M37 40q2-2 4 0" stroke="#2e1065" stroke-width="2" stroke-linecap="round" />
		<path d="M29 47q3 2.6 6 0" stroke="#2e1065" stroke-width="2.4" stroke-linecap="round" />
		<ellipse cx="20" cy="46.5" rx="2.6" ry="1.7" fill="#e8567f" fill-opacity="0.55" />
		<ellipse cx="44" cy="46.5" rx="2.6" ry="1.7" fill="#e8567f" fill-opacity="0.55" />
		<path d="M55 50c-1.6-2.4-5.2-1.4-5.2 1.4 0 2.4 2.8 4 5.2 5.7 2.4-1.7 5.2-3.3 5.2-5.7 0-2.8-3.6-3.8-5.2-1.4z" fill="#e8567f" stroke="#2e1065" stroke-width="2.4" stroke-linejoin="round" />
		<path d="M54 14l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#fbbf24" />
	{:else if name === 'friends'}
		<!-- two best friends and a heart -->
		<circle cx="19" cy="40" r="13" fill="#f9a8c4" stroke="#2e1065" stroke-width="3.5" />
		<circle cx="45" cy="40" r="13" fill="#fde68a" stroke="#2e1065" stroke-width="3.5" />
		<circle cx="15" cy="39" r="2.2" fill="#2e1065" />
		<circle cx="23" cy="39" r="2.2" fill="#2e1065" />
		<path d="M16.5 44q2.5 2.4 5 0" stroke="#2e1065" stroke-width="2.2" stroke-linecap="round" />
		<ellipse cx="11.5" cy="44" rx="2.4" ry="1.6" fill="#e8567f" fill-opacity="0.55" />
		<path d="M41 39q2-2 4 0" stroke="#2e1065" stroke-width="2.2" stroke-linecap="round" />
		<circle cx="49" cy="39" r="2.2" fill="#2e1065" />
		<path d="M42.5 44q2.5 2.4 5 0" stroke="#2e1065" stroke-width="2.2" stroke-linecap="round" />
		<ellipse cx="52.5" cy="44" rx="2.4" ry="1.6" fill="#e8567f" fill-opacity="0.55" />
		<path d="M32 13.5c-3-4.4-9.5-2.6-9.5 2.6 0 4.4 5.2 7.4 9.5 10.4 4.3-3 9.5-6 9.5-10.4 0-5.2-6.5-7-9.5-2.6z" fill="#e8567f" stroke="#2e1065" stroke-width="3" stroke-linejoin="round" />
		<path d="M10 14l1.6 3.8 3.8 1.6-3.8 1.6-1.6 3.8-1.6-3.8-3.8-1.6 3.8-1.6z" fill="#fbbf24" />
		<circle cx="54" cy="17" r="2.4" fill="#a78bfa" />
	{/if}
</svg>
