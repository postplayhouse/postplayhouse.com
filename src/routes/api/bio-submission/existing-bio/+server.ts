import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { fetchBioWithSourceOfTruth } from "../githubHelpers"
import { parseExistingBio } from "../yamlParser"
import * as site from "$data/site"

export const GET = async ({ request }) => {
	const result = individualPassphraseDetails(request)

	if (!result.correct) {
		return json(
			{ error: "Invalid Passphrase", message: "The passphrase you gave was incorrect." },
			{ status: 403 },
		)
	}

	const { position } = result
	const owner = "postplayhouse"
	const repo = "postplayhouse.com"
	const filePath = `src/data/people/${site.season}.yml`
	const prBranchName = `bio-update/position-${position}`

	const fetchResult = await fetchBioWithSourceOfTruth({
		owner,
		repo,
		filePath,
		position,
		prBranchName,
	})

	if (!fetchResult) {
		return json({ data: null, source: null })
	}

	const bioData = parseExistingBio(fetchResult.content, position)
	return json({ data: bioData, source: fetchResult.source })
}
