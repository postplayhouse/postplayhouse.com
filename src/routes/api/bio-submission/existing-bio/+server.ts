import { json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { fetchFileFromBranch } from "../githubHelpers"
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
	const prBranch = `bio-update/position-${position}`

	// Try PR branch first, fall back to master
	let yamlContent: string | null = null
	let source: "pr" | "master" = "master"

	const prResult = await fetchFileFromBranch({ owner, repo, filePath, branchName: prBranch })
	if (prResult.found) {
		yamlContent = prResult.content
		source = "pr"
	} else {
		const masterResult = await fetchFileFromBranch({
			owner,
			repo,
			filePath,
			branchName: "master",
		})
		if (masterResult.found) {
			yamlContent = masterResult.content
		}
	}

	if (!yamlContent) {
		return json({ data: null, source: null })
	}

	const bioData = parseExistingBio(yamlContent, position)

	return json({ data: bioData, source })
}
