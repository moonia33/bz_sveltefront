import type { MoneyOut } from './api/types';

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(m: MoneyOut | null | undefined): string {
	if (!m) return '';
	const currency = (m.currency || 'EUR').toUpperCase();
	let f = formatters.get(currency);
	if (!f) {
		f = new Intl.NumberFormat('lt-LT', { style: 'currency', currency });
		formatters.set(currency, f);
	}
	return f.format(Number(m.gross));
}
