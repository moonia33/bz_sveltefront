import { writable } from 'svelte/store';

export type Toast = { id: number; kind: 'success' | 'error' | 'info'; message: string };

export const toasts = writable<Toast[]>([]);

let seq = 0;

export function pushToast(message: string, kind: Toast['kind'] = 'success') {
	const id = ++seq;
	toasts.update((t) => [...t, { id, kind, message }]);
	setTimeout(() => toasts.update((t) => t.filter((x) => x.id !== id)), 4000);
}
