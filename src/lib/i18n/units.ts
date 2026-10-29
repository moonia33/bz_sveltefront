import { instanceLocale, type Locale } from '#lib/i18n/instance';

// Daiktavardžių formos per Intl.PluralRules — teisingos taisyklės kiekvienai
// kalbai (LT 1/2-9/10+, PL 1/2-4/5+, LV 0/1/2+...). Formos eilės:
// zero/one/two/few/many/other — CLDR rūšys.
type Forms = Partial<Record<Intl.LDMLPluralRule, string>>;

const UNITS: Record<string, Record<Locale, Forms>> = {
	product: {
		lt: { one: 'prekė', few: 'prekės', other: 'prekių' },
		pl: { one: 'produkt', few: 'produkty', many: 'produktów', other: 'produktów' },
		en: { one: 'product', other: 'products' },
		de: { one: 'Produkt', other: 'Produkte' },
		lv: { zero: 'preču', one: 'prece', other: 'preces' },
		et: { one: 'toode', other: 'toodet' }
	},
	subcategory: {
		lt: { one: 'sub-kategorija', few: 'sub-kategorijos', other: 'sub-kategorijų' },
		pl: { one: 'podkategoria', few: 'podkategorie', many: 'podkategorii', other: 'podkategorii' },
		en: { one: 'subcategory', other: 'subcategories' },
		de: { one: 'Unterkategorie', other: 'Unterkategorien' },
		lv: { zero: 'apakškategoriju', one: 'apakškategorija', other: 'apakškategorijas' },
		et: { one: 'alamkategooria', other: 'alamkategooriat' }
	}
};

// unit('product', 5) → 'prekių' / 'produktów' / 'products'… pagal instance locale.
export function unit(kind: keyof typeof UNITS, count: number): string {
	const forms = UNITS[kind][instanceLocale()];
	const rule = new Intl.PluralRules(instanceLocale()).select(count);
	return forms[rule] ?? forms.other ?? forms.one ?? '';
}
