import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'pls-theme';

function readInitial(): Theme {
	if (!browser) return 'dark';
	return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

function apply(theme: Theme) {
	if (!browser) return;
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

function createThemeStore() {
	const store = writable<Theme>(readInitial());
	const { subscribe, set } = store;

	function commit(next: Theme) {
		if (get(store) === next) return;
		if (browser) localStorage.setItem(STORAGE_KEY, next);
		apply(next);
		set(next);
	}

	return {
		subscribe,
		set: commit,
		toggle() {
			commit(get(store) === 'dark' ? 'light' : 'dark');
		},
		init() {
			if (!browser) return;
			apply(readInitial());
		}
	};
}

export const theme = createThemeStore();
