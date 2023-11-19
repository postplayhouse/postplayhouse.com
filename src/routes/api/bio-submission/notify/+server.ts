import { env } from "$env/dynamic/private"
import { assert } from "$helpers"
import { json } from "@sveltejs/kit"
import { passphraseIsCorrect } from "../passphraseHelpers"

const slackUrl = env["SLACK_WEBHOOK_URL"]

export const POST = async ({ request }) => {
	assert(slackUrl, "no slackUrl from ENV")

	if (!passphraseIsCorrect(request)) return new Response("", { status: 403 })

	const { name } = (await request.json()) as { name: string }

	const resp = await fetch(slackUrl, {
		method: "POST",
		headers: new Headers({ "Content-type": "application/json" }),
		body: JSON.stringify({
			text: name
				? `${name} submitted a new bio.`
				: "A new bio has been submitted.",
		}),
	})

	const result = await resp.text()

	return json({ result })
}
