import { env } from "$env/dynamic/private"
import { dev } from "$app/environment"

/**
 * Check if running in production environment.
 * Netlify sets CONTEXT=production for production deploys.
 */
export function isProduction(): boolean {
	return env["CONTEXT"] === "production"
}

/**
 * Check if running in Playwright test environment.
 */
export function isTest(): boolean {
	return env["PLAYWRIGHT_TEST"] === "true"
}

/**
 * Check if running in local development (not test).
 */
export function isDev(): boolean {
	return dev && !isTest()
}
