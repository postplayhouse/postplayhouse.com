import { Octokit } from "@octokit/rest"
import { env } from "$env/dynamic/private"

const octokit = new Octokit({
	auth: env["GITHUB_ACCESS_TOKEN"],
})

export async function updateAndPr({
	owner,
	repo,
	filePath,
	baseBranch,
	commitAndPrMessage,
	newContent,
	prBranch,
}: {
	owner: string
	repo: string
	filePath: string
	baseBranch: string
	commitAndPrMessage: string
	newContent: (
		prev: string,
	) => { success: true; newContent: string } | { success: false; error: string }
	prBranch: string
}) {
	try {
		const masterRef = await octokit.git.getRef({
			owner,
			repo,
			ref: `heads/${baseBranch}`,
		})

		const masterSha = masterRef.data.object.sha

		const markerBranchRef = await octokit.git
			.getRef({
				owner,
				repo,
				ref: `heads/${prBranch}`,
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

		if (currentContentResponse.status !== 200) {
			return { success: false, error: `File not found at ${filePath}` }
		}

		if (
			Array.isArray(currentContentResponse.data) ||
			currentContentResponse.data.type !== "file"
		) {
			return { success: false, error: `No file at ${filePath}` }
		}

		const currentContent = Buffer.from(
			currentContentResponse.data.content,
			"base64",
		).toString("utf-8")

		const newContentResult = newContent(currentContent)

		if (!newContentResult.success) {
			return { success: false, error: newContentResult.error }
		}

		if (!markerBranchSha) {
			await octokit.git.createRef({
				owner,
				repo,
				ref: `refs/heads/${prBranch}`,
				sha: masterSha,
			})
		}

		const blobSha = currentContentResponse.data.sha

		await octokit.repos.createOrUpdateFileContents({
			owner,
			repo,
			path: filePath,
			message: commitAndPrMessage,
			content: Buffer.from(newContentResult.newContent).toString("base64"),
			branch: prBranch,
			sha: blobSha,
		})

		let pullRequest: string | undefined = (
			await octokit.pulls.list({
				owner,
				repo,
				head: `${owner}:${prBranch}`,
				base: baseBranch,
				state: "open",
			})
		).data[0]?.html_url

		if (!pullRequest) {
			pullRequest = (
				await octokit.pulls.create({
					owner,
					repo,
					title: commitAndPrMessage,
					head: prBranch,
					base: baseBranch,
				})
			).data.html_url
		}

		return { success: true, pullRequest } as const
	} catch (error) {
		return { success: false as const, error }
	}
}
