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
	prTitle,
	prBody,
}: {
	owner: string
	repo: string
	baseBranch: string
	prBranch: string
	prTitle: string
	prBody?: string
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
			title: prTitle,
			head: prBranch,
			base: baseBranch,
			body: prBody,
		})
		.then((res) => res.data.html_url)
}

async function getPreviousFileContent({
	owner,
	repo,
	filePath,
	branchName,
	branchSha,
}: {
	owner: string
	repo: string
	filePath: string
	branchName: string
	branchSha?: string
}) {
	if (!branchSha) {
		const {
			data: {
				object: { sha: latestCommitSha },
			},
		} = await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` })
		branchSha = latestCommitSha
	}

	const currentContentResponse = await octokit.repos.getContent({
		owner,
		repo,
		path: filePath,
		ref: branchSha,
	})

	if (currentContentResponse.status !== 200) {
		return { success: false, error: `File not found at ${filePath}` } as const
	}

	if (
		Array.isArray(currentContentResponse.data) ||
		currentContentResponse.data.type !== "file"
	) {
		return { success: false, error: `No file at ${filePath}` } as const
	}

	return {
		success: true,
		previousContent: Buffer.from(
			currentContentResponse.data.content,
			"base64",
		).toString("utf-8"),
	} as const
}

async function commitMultipleFiles({
	owner,
	repo,
	branchName,
	files,
	commitMessage,
	branchSha,
}: {
	owner: string
	repo: string
	branchName: string
	branchSha?: string
	files: { path: string; content: string; encoding: "utf-8" | "base64" }[]
	commitMessage: string
}) {
	let latestCommitSha: string

	if (branchSha) {
		latestCommitSha = branchSha
	} else {
		const {
			data: {
				object: { sha: latestCommitSha_ },
			},
		} = await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` })
		latestCommitSha = latestCommitSha_
	}

	const {
		data: {
			tree: { sha: baseTreeSha },
		},
	} = await octokit.git.getCommit({ owner, repo, commit_sha: latestCommitSha })

	const newTree = await Promise.all(
		files.map(async ({ path, content, encoding }) => {
			const blob = await octokit.git.createBlob({
				owner,
				repo,
				content,
				encoding,
			})
			return {
				path,
				mode: "100644",
				type: "blob",
				sha: blob.data.sha,
			} as const
		}),
	)

	const {
		data: { sha: newTreeSha },
	} = await octokit.git.createTree({
		owner,
		repo,
		base_tree: baseTreeSha,
		tree: newTree,
	})

	const {
		data: { sha: newCommitSha },
	} = await octokit.git.createCommit({
		owner,
		repo,
		message: commitMessage,
		tree: newTreeSha,
		parents: [latestCommitSha],
	})

	await octokit.git.updateRef({
		owner,
		repo,
		ref: `heads/${branchName}`,
		sha: newCommitSha,
	})
}

export async function updateAndPr({
	owner,
	repo,
	fileContent,
	filePath,
	imageFile,
	imagePath,
	baseBranch,
	commitAndPrTitle,
	prBody,
	prBranch,
}: {
	owner: string
	repo: string
	filePath: string
	imageFile?: File
	imagePath?: string
	baseBranch: string
	commitAndPrTitle: string
	prBody?: string
	fileContent: (
		prev: string,
	) => { success: true; newContent: string } | { success: false; error: string }
	prBranch: string
}) {
	const prBranchSha = await getOrCreateBranch({
		owner,
		repo,
		baseBranch,
		targetBranch: prBranch,
	}).then((res) => res.data.object.sha)

	const getFileResult = await getPreviousFileContent({
		owner,
		repo,
		filePath,
		branchName: prBranch,
		branchSha: prBranchSha,
	})

	if (!getFileResult.success) {
		return getFileResult
	}

	const newContentResult = fileContent(getFileResult.previousContent)

	if (!newContentResult.success) {
		return newContentResult
	}

	const filesArr = [
		{
			path: filePath,
			content: newContentResult.newContent,
			encoding: "utf-8",
		},
	] as Parameters<typeof commitMultipleFiles>[0]["files"]

	if (imageFile && imagePath) {
		const base64Image = await imageFile
			.arrayBuffer()
			.then((buf) => Buffer.from(buf).toString("base64"))
		filesArr.push({
			path: imagePath,
			content: base64Image,
			encoding: "base64",
		})
	}

	await commitMultipleFiles({
		owner,
		repo,
		commitMessage: commitAndPrTitle,
		files: filesArr,
		branchName: prBranch,
		branchSha: prBranchSha,
	})

	const pullRequest = await getOrCreatePr({
		owner,
		repo,
		baseBranch,
		prBranch,
		prTitle: commitAndPrTitle,
		prBody,
	})

	return { success: true, pullRequest } as const
}
