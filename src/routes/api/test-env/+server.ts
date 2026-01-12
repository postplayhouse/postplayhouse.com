import { json } from "@sveltejs/kit"
import { env } from "$env/dynamic/private"
import { isProduction, isTest, isDev } from "$lib/server/env"

/**
 * Debug endpoint to verify environment detection is working.
 * Only returns data in non-production environments.
 */
export const GET = async () => {
	// Don't expose this in production
	if (isProduction()) {
		return json({ error: "Not available in production" }, { status: 404 })
	}

	return json({
		isProduction: isProduction(),
		isTest: isTest(),
		isDev: isDev(),
		b2TestBucketConfigured: !!(env["B2_TEST_BUCKET_ID"] && env["B2_TEST_BUCKET_NAME"]),
		b2TestBucketId: env["B2_TEST_BUCKET_ID"] ? "set" : "not set",
		b2TestBucketName: env["B2_TEST_BUCKET_NAME"] ? "set" : "not set",
	})
}
