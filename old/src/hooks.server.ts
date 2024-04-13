import { sequence } from "@sveltejs/kit/hooks"
import { handleErrorWithSentry, sentryHandle } from "@sentry/sveltekit"
import * as Sentry from "@sentry/sveltekit"

Sentry.init({
	dsn: "https://a4fcfbbcd27a8b3e68b97ec24e7c2e32@o4506915708141568.ingest.us.sentry.io/4506915710763008",
	tracesSampleRate: 1.0,

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
})

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle())

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry()
