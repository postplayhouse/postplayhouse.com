import { Octokit } from "@octokit/rest"
import { env } from "$env/dynamic/private"

const octokit = new Octokit({
	auth: env["GITHUB_ACCESS_TOKEN"],
})

async function getOrCreateBranch({
	owner,
	repo,
	baseBranch,
	targetBranch,
}: {
	owner: string
	repo: string
	baseBranch: string
	targetBranch: string
}) {
	try {
		return await octokit.git.getRef({
			owner,
			repo,
			ref: `heads/${targetBranch}`,
		})
	} catch {
		const baseSha = await octokit.git
			.getRef({
				owner,
				repo,
				ref: `heads/${baseBranch}`,
			})
			.then((res) => res.data.object.sha)
		return await octokit.git.createRef({
			owner,
			repo,
			ref: `refs/heads/${targetBranch}`,
			sha: baseSha,
		})
	}
}

async function getOrCreatePr({
	owner,
	repo,
	baseBranch,
	prBranch,
	prMessage,
}: {
	owner: string
	repo: string
	baseBranch: string
	prBranch: string
	prMessage: string
}) {
	const url = await octokit.pulls
		.list({
			owner,
			repo,
			head: `${owner}:${prBranch}`,
			base: baseBranch,
			state: "open",
		})
		.then((res) => res.data[0]?.html_url)

	if (url) return url

	return octokit.pulls
		.create({
			owner,
			repo,
			title: prMessage,
			head: prBranch,
			base: baseBranch,
		})
		.then((res) => res.data.html_url)
}

async function commitNewFileContent({
	owner,
	repo,
	filePath,
	commitMessage,
	newContent,
	branchName,
	branchSha,
}: {
	owner: string
	repo: string
	filePath: string
	commitMessage: string
	newContent: (
		prev: string,
	) => { success: true; newContent: string } | { success: false; error: string }
	branchName: string
	branchSha: string
}) {
	const currentContentResponse = await octokit.repos.getContent({
		owner,
		repo,
		path: filePath,
		ref: branchSha,
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

	const blobSha = currentContentResponse.data.sha

	await octokit.repos.createOrUpdateFileContents({
		owner,
		repo,
		path: filePath,
		message: commitMessage,
		content: Buffer.from(newContentResult.newContent).toString("base64"),
		branch: branchName,
		sha: blobSha,
	})
}

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
		const prBranchSha = await getOrCreateBranch({
			owner,
			repo,
			baseBranch,
			targetBranch: prBranch,
		}).then((res) => res.data.object.sha)

		await commitNewFileContent({
			owner,
			repo,
			filePath,
			commitMessage: commitAndPrMessage,
			newContent,
			branchName: prBranch,
			branchSha: prBranchSha,
		})

		const pullRequest = await getOrCreatePr({
			owner,
			repo,
			baseBranch,
			prBranch,
			prMessage: commitAndPrMessage,
		})

		return { success: true, pullRequest } as const
	} catch (error) {
		return { success: false as const, error }
	}
}
