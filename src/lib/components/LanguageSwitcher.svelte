<script lang="ts">
	import { locale } from '$lib/i18n';

	function toggle() {
		locale.update((l) => (l === 'da' ? 'en' : 'da'));
	}
</script>

<button
	onclick={toggle}
	class="text-sm font-bold text-text-soft hover:text-primary px-2.5 py-1 rounded-full border-2 border-primary-light/40 hover:border-primary hover:bg-primary-light/20 transition-all active:scale-95"
>
	{$locale === 'da' ? '🇬🇧 EN' : '🇩🇰 DA'}
</button>
