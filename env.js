const prod = process.env.NODE_ENV === "production"
const live = process.env.CONTEXT === "production"
const liveUrl = "https://postplayhouse.com"
export const buildUrl = live
	? liveUrl
	: prod
		? process.env.DEPLOY_PRIME_URL || liveUrl
		: "http://localhost:3000"

/** Will be available via sveltekit's $env imports */
process.env.PUBLIC_BUILD_URL = buildUrl
