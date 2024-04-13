import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"

export const GET = async ({ request }) => {
	const result = individualPassphraseDetails(request)
	return result.correct
		? new Response(JSON.stringify({ position: result.position }), {
				status: 201,
			})
		: json(
				{
					error: "Invalid Passphrase",
					message: "The passphrase you gave was incorrect.",
				},
				{ status: 403 },
			)
}
