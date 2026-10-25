/** Serialize an object as a JSON-LD <script> tag for {@html} inside svelte:head. */
export function jsonLd(obj: unknown): string {
	const json = JSON.stringify(obj).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${json}</script>`;
}
