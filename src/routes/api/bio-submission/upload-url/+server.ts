import { env } from "$env/dynamic/private"
import { assert } from "$helpers"
import { error, json } from "@sveltejs/kit"
import { passphraseIsCorrect } from "../passphraseHelpers"
import type { AuthorizeAccountSuccessResponse } from "./b2-types"

type GetAuthorizeAccountResponse = AuthorizeAccountSuccessResponse

type GetUploadUrlResponse = {
	bucketId: string
	uploadUrl: string
	authorizationToken: string
}

type FinalResponse = Array<
	Pick<GetUploadUrlResponse, "authorizationToken" | "uploadUrl">
>

const b2Creds = {
	keyId: env["B2_APPLICATION_KEY_ID"],
	key: env["B2_APPLICATION_KEY"],
	bucketId: env["B2_BUCKET_ID"],
}

function base64Encode(str: string) {
	return Buffer.from(str).toString("base64")
}

const auth = "Basic " + base64Encode(`${b2Creds.keyId}:${b2Creds.key}`)

const authorizeEndpoint =
	"https://api.backblazeb2.com/b2api/v2/b2_authorize_account"

const headers = new Headers({ Authorization: auth })

export const GET = async ({ request }) => {
	assert(b2Creds.bucketId, "no bucketId from ENV")
	assert(b2Creds.key, "no key from ENV")
	assert(b2Creds.keyId, "no keyId from ENV")

	if (!passphraseIsCorrect(request)) return new Response("", { status: 403 })

	const url = new URL(request.url)
	const count = Number(url.searchParams.get("count")) || 1

	const responses: FinalResponse = []

	for (const _ of Array.from({ length: count })) {
		const resp = await fetch(authorizeEndpoint, { headers, method: "GET" })

		if (!resp.ok) {
			throw error(500, "Could not authorize account for storage provider")
		}

		const authData = (await resp.json()) as GetAuthorizeAccountResponse

		const resp2 = await fetch(authData.apiUrl + "/b2api/v2/b2_get_upload_url", {
			method: "POST",
			body: JSON.stringify({ bucketId: b2Creds.bucketId }),
			headers: new Headers({ Authorization: authData.authorizationToken }),
		})

		if (!resp2.ok) {
			throw error(
				500,
				"Could not fetch upload endpoint details from the storage provider",
			)
		}

		const { uploadUrl, authorizationToken } =
			(await resp2.json()) as GetUploadUrlResponse

		responses.push({ uploadUrl, authorizationToken })
	}

	return json(responses)
}
