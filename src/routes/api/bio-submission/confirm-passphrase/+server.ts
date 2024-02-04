import { json } from "@sveltejs/kit"
import { passphraseIsCorrect } from "../passphraseHelpers"
import { Octokit } from "@octokit/rest"
import { env } from "$env/dynamic/private"
import site from "$data/site"

const octokit = new Octokit({
	auth: env["GITHUB_ACCESS_TOKEN"],
})

const owner = "postplayhouse"
const repo = "postplayhouse.com"
const filePath = `src/data/people/${site.season}.yml`
const masterBranch = "master"

async function updatePeopleData({
	personName,
	newContent,
	markerId,
}: {
	personName: string
	newContent: string
	markerId: string
}) {
	const markerBranch = markerId
	try {
		const masterRef = await octokit.git.getRef({
			owner,
			repo,
			ref: `heads/${masterBranch}`,
		})

		const masterSha = masterRef.data.object.sha

		const markerBranchRef = await octokit.git
			.getRef({
				owner,
				repo,
				ref: `heads/${markerBranch}`,
			})
			.catch(() => undefined)

		const markerBranchSha = markerBranchRef?.data.object.sha

		const startingSha = markerBranchSha || masterSha

		const currentContentResponse = await octokit.repos.getContent({
			owner,
			repo,
			path: filePath,
			ref: startingSha,
		})

		const currentContent = Buffer.from(
			currentContentResponse.data.content,
			"base64",
		).toString("utf-8")

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

		const updatedContent = `${currentContent.slice(0, startIdx + startTag.length)}\n${newContent}\n${currentContent.slice(endIdx)}`

		if (!markerBranchSha) {
			await octokit.git.createRef({
				owner,
				repo,
				ref: `refs/heads/${markerBranch}`,
				sha: masterSha,
			})
		}

		const blobSha = currentContentResponse.data.sha

		await octokit.repos.createOrUpdateFileContents({
			owner,
			repo,
			path: filePath,
			message: `${personName} bio`,
			content: Buffer.from(updatedContent).toString("base64"),
			branch: markerBranch,
			sha: blobSha,
		})

		let pullRequest: string | undefined = (
			await octokit.pulls.list({
				owner,
				repo,
				head: `${owner}:${markerBranch}`,
				base: masterBranch,
				state: "open",
			})
		).data[0]?.html_url

		if (!pullRequest) {
			pullRequest = (
				await octokit.pulls.create({
					owner,
					repo,
					title: `${personName} bio`,
					head: markerBranch,
					base: masterBranch,
				})
			).data.html_url
		}

		return { success: true, pullRequest } as const
	} catch (error) {
		return { success: false as const, error }
	}
}

export const GET = async ({ request }) => {
	const result = await updatePeopleData({
		personName: "Don Denton",
		newContent: "Chaaaanges 40!",
		markerId: "foxtrot",
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
