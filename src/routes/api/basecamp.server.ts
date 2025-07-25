import { env } from "$env/dynamic/private"
import { assert } from "$helpers"

const bioBotIntegrationKey = env["BASECAMP_BIO_BOT_INTEGRATION_KEY"]
const basecampBioBotBase = `https://3.basecamp.com/5732828/integrations/${bioBotIntegrationKey}`

const chatRooms = {
	admin: { bucket: "35764144", chat: "6909843385" },
	websiteUpdates: { bucket: "35764144", chat: "7169912985" },
}

export function urlForChatRoom(room: keyof typeof chatRooms) {
	assert(bioBotIntegrationKey, "no bio bot key from ENV")
	const { bucket, chat } = chatRooms[room]
	return `${basecampBioBotBase}/buckets/${bucket}/chats/${chat}/lines.json`
}
