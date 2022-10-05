import { json } from "@sveltejs/kit"
import { passphraseIsCorrect } from "../passphraseHelpers"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({ request }) => {
  return passphraseIsCorrect(request)
    ? new Response("", { status: 201 })
    : json(
        {
          error: "Invalid Passphrase",
          message: "The passphrase you gave was incorrect.",
        },
        { status: 403 },
      )
}
