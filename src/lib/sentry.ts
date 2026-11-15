import type { BrowserOptions } from "@sentry/sveltekit";
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from "$app/env/public";

// Bendri SSR ir naršyklės nustatymai: tik klaidos, be asmens duomenų
// (IP, cookies, headeriai), be session replay.
export const sentryOptions = {
  dsn: SENTRY_DSN || undefined,
  enabled: Boolean(SENTRY_DSN),
  environment: SENTRY_ENVIRONMENT,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    stackFrameVariables: false,
  },
} satisfies BrowserOptions;
