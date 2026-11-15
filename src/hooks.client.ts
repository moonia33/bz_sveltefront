// Registruoja instance locale override'ą anksti — prieš pirmą m.*() kvietimą.
import '#lib/i18n/instance';
import * as Sentry from '@sentry/sveltekit';
import { sentryOptions } from '#lib/sentry';

Sentry.init(sentryOptions);

export const handleError = Sentry.handleErrorWithSentry();
