import * as Sentry from "@sentry/sveltekit";
import { sentryOptions } from "#lib/sentry";

Sentry.init(sentryOptions);
