/**
 * Lithuanian plural rules (one / few / other).
 * pluralLt(1, ['prekė','prekės','prekių']) → 'prekė'
 * pluralLt(2, …) → 'prekės'; pluralLt(21, …) → 'prekė'; pluralLt(11, …) → 'prekių'
 */
export function pluralLt(n: number, forms: [string, string, string]): string {
	const abs = Math.abs(n);
	const mod10 = abs % 10;
	const mod100 = abs % 100;
	if (mod10 === 1 && mod100 !== 11) return forms[0];
	if (mod10 >= 2 && mod10 <= 9 && (mod100 < 10 || mod100 >= 20)) return forms[1];
	return forms[2];
}
