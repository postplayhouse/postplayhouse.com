import crypto from "crypto"
import jwt from "jsonwebtoken"
import { text } from "@sveltejs/kit"
import { sendMessageToChatRoom } from "../basecamp.server"
import { invertObject } from "$helpers"
import { env } from "$env/dynamic/private"
import { assert } from "$helpers"

const secret = env["NETLIFY_WEBHOOK_SECRET"]

type Payload = {
	id: string
	state: "building" | "error" | "ready" | (string & {}) // there are more...
	title?: string | null
	context?: string
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
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

	if (!isValid) {
		sendMessageToChatRoom(
			fetch,
			"websiteUpdates",
			"Received invalid Netlify webhook signature",
		)
		console.log("Invalid Netlify webhook signature with body:", body)
		return text("", { status: 400 })
	}

	const data = JSON.parse(body) as Payload

	const buildStatus = getStatus(data.state)
	const deployUrl = `https://app.netlify.com/projects/postplayhouse-main-site/deploys/${data.id}`
	const change = data.title?.split("\n")[0]?.trim()
	const changeLine = change ? `<br>Change: “${escapeHtml(change)}”` : ""
	const details = `<br><br>Details: ${deployUrl}`

	if (buildStatus === "failed") {
		const summary =
			data.context && data.context !== "production"
				? "Heads up: a marketing site preview didn’t build. The live site isn’t affected."
				: "Heads up: the latest marketing site update didn’t go live. The site is still showing the previous version."
		sendMessageToChatRoom(
			fetch,
			"websiteUpdates",
			summary + changeLine + details,
		)
	} else if (buildStatus === "status unknown") {
		sendMessageToChatRoom(
			fetch,
			"websiteUpdates",
			`The marketing site sent an update we didn’t recognize (“${escapeHtml(data.state)}”).${changeLine}${details}`,
		)
	}

	return text("", { status: 200 })
}
