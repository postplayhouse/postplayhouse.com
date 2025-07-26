import { env } from "$env/dynamic/private"
import { assert } from "$helpers"

const bioBotIntegrationKey = env["BASECAMP_BIO_BOT_INTEGRATION_KEY"]
const basecampBioBotBase = `https://3.basecamp.com/5732828/integrations/${bioBotIntegrationKey}`

const chatRooms = {
	admin: { bucket: "35764144", chat: "6909843385" },
	websiteUpdates: { bucket: "35764144", chat: "7169912985" },
}

function urlForChatRoom(room: keyof typeof chatRooms) {
	assert(bioBotIntegrationKey, "no bio bot key from ENV")
	const { bucket, chat } = chatRooms[room]
	assert(bucket, `no bucket for room ${room}`)
	assert(chat, `no chat for room ${room}`)
	return `${basecampBioBotBase}/buckets/${bucket}/chats/${chat}/lines.json`
}

export function sendMessageToChatRoom(
	fetch: typeof globalThis.fetch,
	room: keyof typeof chatRooms,
	content: string,
) {
	fetch(urlForChatRoom(room), {
		method: "POST",
		headers: new Headers({ "Content-type": "application/json" }),
		body: JSON.stringify({ content }),
	})
}
