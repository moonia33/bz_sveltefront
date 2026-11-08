export const fmtBlogDate = (iso: string) =>
	new Date(iso).toLocaleDateString('lt-LT', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'Europe/Vilnius'
	});
