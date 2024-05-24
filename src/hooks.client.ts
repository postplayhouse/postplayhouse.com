import { handleErrorWithSentry, replayIntegration } from "@sentry/sveltekit"
import * as Sentry from "@sentry/sveltekit"

Sentry.init({
	dsn: "https://a4fcfbbcd27a8b3e68b97ec24e7c2e32@o4506915708141568.ingest.us.sentry.io/4506915710763008",
	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [
		replayIntegration({
			maskAllText: false,
			blockAllMedia: false,
		}),
	],
})

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry()
