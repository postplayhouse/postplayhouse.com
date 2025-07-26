import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { dev } from "$app/environment"
import { sendMessageToChatRoom } from "../../basecamp.server"

export const POST = async ({ request, fetch }) => {
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

	sendMessageToChatRoom(fetch, dev ? "websiteUpdates" : "admin", content)

	return json({ ok: "ok" })
}
