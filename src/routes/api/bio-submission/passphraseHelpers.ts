import { env } from "$env/dynamic/private"
import { assert, sanitizedPassphrase } from "$helpers"

const passphraseListEnv = env["INDIVIDUAL_PASSPHRASES_LIST"]

export function individualPassphraseDetails(request: Request) {
	assert(passphraseListEnv, "No passphrase list found in ENV")

	const passphrase = sanitizedPassphrase(request.headers.get("Authorization"))
	const idx = passphraseListEnv
		.split(",")
		.map(sanitizedPassphrase)
		.findIndex((individualPassphrase) => {
			return individualPassphrase === passphrase
		})

	if (idx !== -1) {
		return {
			correct: true,
			position: idx + 1,
		} as const
	}

	return {
		correct: false,
	} as const
}
