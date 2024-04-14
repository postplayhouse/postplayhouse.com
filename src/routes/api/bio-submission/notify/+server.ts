import { env } from "$env/dynamic/private"
import { assert } from "$helpers"
import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { dev } from "$app/environment"

const slackUrl = env["SLACK_WEBHOOK_URL"]
const bioBotIntegrationKey = env["BASECAMP_BIO_BOT_INTEGRATION_KEY"]
const basecampBioBotBase = `https://3.basecamp.com/5732828/integrations/${bioBotIntegrationKey}`

const chatRooms = {
	admin: { bucket: "35764144", chat: "6909843385" },
	websiteUpdates: { bucket: "35764144", chat: "7169912985" },
}

function urlForChatRoom(room: (typeof chatRooms)[keyof typeof chatRooms]) {
	const { bucket, chat } = room
	return `${basecampBioBotBase}/buckets/${bucket}/chats/${chat}/lines.json`
}

export const POST = async ({ request, fetch }) => {
	assert(slackUrl, "no slackUrl from ENV")
	assert(bioBotIntegrationKey, "no bio bot key from ENV")

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
		fetch(urlForChatRoom(chatRooms.websiteUpdates), {
			method,
			headers,
			body: JSON.stringify({ content }),
		})
	} else {
		fetch(urlForChatRoom(chatRooms.admin), {
			method,
			headers,
			body: JSON.stringify({ content }),
		})
	}

	return json({ ok: "ok" })
}
