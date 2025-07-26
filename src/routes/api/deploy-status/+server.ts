import crypto from "crypto"
import jwt from "jsonwebtoken"
import { text } from "@sveltejs/kit"
import { urlForChatRoom } from "../basecamp.server"
import { invertObject } from "$helpers"
import { env } from "$env/dynamic/private"
import { assert } from "$helpers"

const secret = env["NETLIFY_WEBHOOK_SECRET"]

type Payload = {
	state: "building" | "error" | "ready" // there are more...
	links: {
		permalink: string
	}
}

const state = {
	succeeded: "ready",
	started: "building",
	failed: "error",
} as const

const inverted = invertObject(state)

interface InvertedState {
	[key: string]: keyof typeof state | undefined
}

function getStatus(state: keyof typeof inverted | string) {
	return (inverted as InvertedState)[state] || "status unknown"
}

function validateSignature(token: string, body: string) {
	assert(secret, "No Netlify secret found in ENV")
	const options = { issuer: "netlify", algorithms: ["HS256" as const] }
	const decoded = jwt.verify(token, secret, options)
	const hashedBody = crypto.createHash("sha256").update(body).digest("hex")
	return (decoded as Exclude<typeof decoded, string>).sha256 === hashedBody
}

export const POST = async ({ request: req, fetch }) => {
	const signature = req.headers.get("x-webhook-signature")
	const body = await req.text()
	const isValid = signature ? validateSignature(signature, body) : false

	if (!isValid) return text("", { status: 400 })

	const data = JSON.parse(body) as Payload

	const headers = new Headers({ "Content-type": "application/json" })
	const method = "POST"
	const buildStatus = getStatus(data.state)
	let content = `Website deployment ${buildStatus}. https://app.netlify.com/projects/postplayhouse-main-site/deploys`

	if (buildStatus === "status unknown" || buildStatus === "failed") {
		content += `\n\n${JSON.stringify(data, null, 2)}`

		fetch(urlForChatRoom("websiteUpdates"), {
			method,
			headers,
			body: JSON.stringify({ content }),
		})
	}

	return text("", { status: 200 })
}
