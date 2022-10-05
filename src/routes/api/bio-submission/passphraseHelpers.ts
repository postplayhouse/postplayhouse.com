import { env } from "$env/dynamic/private"
import { sanitizedPassphrase } from "$helpers"

export function passphraseIsCorrect(request: Request) {
  const passphrase = request.headers.get("Authorization")

  return (
    sanitizedPassphrase(passphrase) ===
    sanitizedPassphrase(env["POST_BIO_SUBMISSION_PASSPHRASE"])
  )
}
