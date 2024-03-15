import { env } from "$env/dynamic/private"
import { assert } from "$helpers"
import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"

const slackUrl = env["SLACK_WEBHOOK_URL"]
const basecampUrl = env["BASECAMP_ADMIN_CHATBOT_WEBHOOK_URL"]

export const POST = async ({ request }) => {
	assert(slackUrl, "no slackUrl from ENV")

	if (!individualPassphraseDetails(request).correct)
		return new Response("", { status: 403 })

	const { name, pullRequest } = (await request.json()) as {
		name: string
		pullRequest?: string
	}

	const content = [
		name ? `${name} submitted a new bio.` : "A new bio has been submitted.",
		pullRequest,
	]
		.filter(Boolean)
		.join("\n")

	fetch(slackUrl, {
		method: "POST",
		headers: new Headers({ "Content-type": "application/json" }),
		body: JSON.stringify({
			text: content,
		}),
	})

	assert(basecampUrl, "no basecampUrl from ENV")

	fetch(basecampUrl, {
		method: "POST",
		headers: new Headers({ "Content-type": "application/json" }),
		body: JSON.stringify({ content }),
	})

	return json({ ok: "ok" })
}
