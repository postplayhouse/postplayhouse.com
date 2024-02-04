import { json } from "@sveltejs/kit"
import site from "$data/site"
import { passphraseIsCorrect } from "../passphraseHelpers"
import { updateAndPr } from "../githubHelpers"

export const GET = async ({ request }) => {
	const markerId = "foxtrot"
	const newBio = "Don Denton is me me me"

	const result = await updateAndPr({
		owner: "postplayhouse",
		repo: "postplayhouse.com",
		filePath: `src/data/people/${site.season}.yml`,
		baseBranch: "master",

		commitAndPrMessage: "Don Denton",
		newContent: (currentContent) => {
			const startTag = `# start ${markerId}`
			const endTag = `# end ${markerId}`
			const startIdx = currentContent.indexOf(startTag)
			const endIdx = currentContent.indexOf(endTag)

			if (startIdx === -1 || endIdx === -1) {
				// Handle error when start and/or end tags are not found
				return {
					success: false as const,
					error: `Start and/or end tags not found for ${markerId}.`,
				}
			}

			return {
				success: true,
				newContent: `${currentContent.slice(0, startIdx + startTag.length)}\n${newBio}\n${currentContent.slice(endIdx)}`,
			}
		},
		prBranch: markerId,
	})
	console.log(result)

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
