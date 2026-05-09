import { writable, derived } from 'svelte/store';
import da from './da';
import en from './en';

type Locale = 'da' | 'en';

const translations: Record<Locale, Record<string, string>> = { da, en };

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('wishy-locale') : null;
export const locale = writable<Locale>((stored as Locale) || 'da');

locale.subscribe((val) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('wishy-locale', val);
	}
});

export const t = derived(locale, ($locale) => {
	return (key: string, params?: Record<string, string>) => {
		let text = translations[$locale]?.[key] || translations['da']?.[key] || key;
		if (params) {
			for (const [k, v] of Object.entries(params)) {
				text = text.replace(`{${k}}`, v);
			}
		}
		return text;
	};
});
