import { env } from "$env/dynamic/private"
import { assert } from "$helpers"
import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { dev } from "$app/environment"
import { urlForChatRoom } from "../../basecamp.server"

const slackUrl = env["SLACK_WEBHOOK_URL"]

export const POST = async ({ request, fetch }) => {
	assert(slackUrl, "no slackUrl from ENV")

	if (!dev && !individualPassphraseDetails(request).correct)
		return new Response("", { status: 403 })

	const { name, pullRequest } = (await request.json()) as {
		name: string
		pullRequest?: string
	}

	const content = [
		dev ? "DEV TEST: " : "",
		name ? `${name} submitted a new bio.` : "A new bio has been submitted.",
		pullRequest && pullRequest + "/files",
	]
		.filter(Boolean)
		.join("\n")

	const headers = new Headers({ "Content-type": "application/json" })
	const method = "POST"

	fetch(slackUrl, {
		method,
		headers,
		body: JSON.stringify({
			text: content,
		}),
	})

	if (dev) {
		fetch(urlForChatRoom("websiteUpdates"), {
			method,
			headers,
			body: JSON.stringify({ content }),
		})
	} else {
		fetch(urlForChatRoom("admin"), {
			method,
			headers,
			body: JSON.stringify({ content }),
		})
	}

	return json({ ok: "ok" })
}
