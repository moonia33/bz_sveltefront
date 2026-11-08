import { writable } from 'svelte/store';
import type { ShopConfigOut } from '#lib/api/types';

export const CONSENT_COOKIE = 'bz_consent';
const MAX_AGE = 60 * 60 * 24 * 180;

export type ConsentChoice = { functional: boolean; analytics: boolean; marketing: boolean };
export type ConsentState = ConsentChoice & { v: number; id: string };
export type ConsentAction = 'accept_all' | 'reject_all' | 'custom';

export type TrackingConfig = { version: number; gtm: string; ga4: string; meta: string };

/** Atidaro juostos nustatymus (pvz. iš poraštės). */
export const cookieSettingsOpen = writable(false);

// ID įterpiami į inline skriptą, todėl leidžiam tik griežtą formatą.
const clean = (v: string | undefined, re: RegExp) => (v && re.test(v.trim()) ? v.trim() : '');

export function trackingConfig(cfg: ShopConfigOut | null | undefined): TrackingConfig {
	return {
		version: Math.max(1, Math.floor(Number(cfg?.cookie_consent_version) || 1)),
		gtm: clean(cfg?.gtm_container_id, /^GTM-[A-Z0-9]+$/),
		ga4: clean(cfg?.ga4_measurement_id, /^G-[A-Z0-9]+$/),
		meta: clean(cfg?.meta_pixel_id, /^[0-9]+$/)
	};
}

export function parseConsent(raw: string | null | undefined, version: number): ConsentState | null {
	if (!raw) return null;
	try {
		const c = JSON.parse(raw.startsWith('%') ? decodeURIComponent(raw) : raw);
		if (!c || c.v !== version || typeof c.id !== 'string') return null;
		return { v: c.v, id: c.id, functional: !!c.functional, analytics: !!c.analytics, marketing: !!c.marketing };
	} catch {
		return null;
	}
}

/**
 * Inline skriptas <head> pradžioje: Google Consent Mode v2 numatytai „denied“,
 * grįžusiam lankytojui iškart „update“ iš slapuko, tada GTM / GA4.
 * Meta Pixel kraunamas tik su rinkodaros sutikimu (window.__bzLoadMeta).
 */
export function consentHeadScript(t: TrackingConfig): string {
	const js = `(function(){var w=window,d=document;w.dataLayer=w.dataLayer||[];function gtag(){w.dataLayer.push(arguments)}w.gtag=w.gtag||gtag;
var G=function(b){return b?'granted':'denied'};
w.__bzConsentSignals=function(c){return{ad_storage:G(c.marketing),ad_user_data:G(c.marketing),ad_personalization:G(c.marketing),analytics_storage:G(c.analytics),functionality_storage:G(c.functional),personalization_storage:G(c.functional)}};
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
var c=null;try{var m=d.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(m){c=JSON.parse(decodeURIComponent(m[1]));if(!c||c.v!==${t.version})c=null}}catch(e){c=null}
if(c){gtag('consent','update',w.__bzConsentSignals(c))}
w.__bzLoadMeta=function(){${
		t.meta
			? `if(w.fbq)return;!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(w,d,'script','https://connect.facebook.net/en_US/fbevents.js');w.fbq('consent','grant');w.fbq('init','${t.meta}');w.fbq('track','PageView');`
			: ''
	}};
if(c&&c.marketing){w.__bzLoadMeta()}
${
		t.gtm
			? `w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});var g=d.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtm.js?id=${t.gtm}';d.head.appendChild(g);`
			: ''
	}${
		t.ga4
			? `var a=d.createElement('script');a.async=true;a.src='https://www.googletagmanager.com/gtag/js?id=${t.ga4}';d.head.appendChild(a);gtag('js',new Date());gtag('config','${t.ga4}');`
			: ''
	}})();`;
	return `<script>${js}</script>`;
}

type W = Window & {
	gtag?: (...a: unknown[]) => void;
	fbq?: (...a: unknown[]) => void;
	dataLayer?: unknown[];
	__bzConsentSignals?: (c: ConsentChoice) => Record<string, string>;
	__bzLoadMeta?: () => void;
};

function newId(): string {
	return typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
				const r = (Math.random() * 16) | 0;
				return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
			});
}

export function saveConsent(
	choice: ConsentChoice,
	action: ConsentAction,
	version: number,
	prev: ConsentState | null
): ConsentState {
	const state: ConsentState = { v: version, id: prev?.id || newId(), ...choice };
	const secure = location.protocol === 'https:' ? '; Secure' : '';
	document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;

	const w = window as W;
	if (w.gtag && w.__bzConsentSignals) w.gtag('consent', 'update', w.__bzConsentSignals(choice));
	w.dataLayer?.push({ event: 'consent_update', ...choice });
	if (choice.marketing) {
		if (w.fbq) w.fbq('consent', 'grant');
		else w.__bzLoadMeta?.();
	} else if (w.fbq) {
		w.fbq('consent', 'revoke');
	}

	fetch('/api/v1/analytics/cookie-consent', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ consent_id: state.id, version, action, ...choice }),
		keepalive: true
	}).catch(() => {});
	return state;
}

/** SPA navigacijos PageView Meta'i (GA4 history pokyčius seka pats). */
export function trackPageView() {
	const w = window as W;
	w.fbq?.('track', 'PageView');
}
