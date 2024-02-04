import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"

export const GET = async ({ request }) => {
	return individualPassphraseDetails(request).correct
		? new Response("", { status: 201 })
		: json(
				{
					error: "Invalid Passphrase",
					message: "The passphrase you gave was incorrect.",
				},
				{ status: 403 },
			)
}
