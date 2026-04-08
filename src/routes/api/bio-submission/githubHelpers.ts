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

export async function fetchBioWithSourceOfTruth({
	owner,
	repo,
	filePath,
	position,
	prBranchName,
}: {
	owner: string
	repo: string
	filePath: string
	position: number
	prBranchName: string
}): Promise<{ content: string; source: "pr" | "master" } | null> {
	const query = `
		query ($owner: String!, $repo: String!, $filePath: String!, $masterExpression: String!, $prBranchRef: String!, $prFileExpression: String!) {
			repository(owner: $owner, name: $repo) {
				masterFile: object(expression: $masterExpression) {
					... on Blob { text }
				}
				masterBlame: object(expression: "master") {
					... on Commit {
						blame(path: $filePath) {
							ranges {
								startingLine
								endingLine
								commit { committedDate }
							}
						}
					}
				}
				prBranch: ref(qualifiedName: $prBranchRef) {
					target {
						... on Commit { committedDate }
					}
				}
				prFile: object(expression: $prFileExpression) {
					... on Blob { text }
				}
			}
		}
	`

	const variables = {
		owner,
		repo,
		filePath,
		masterExpression: `master:${filePath}`,
		prBranchRef: `refs/heads/${prBranchName}`,
		prFileExpression: `${prBranchName}:${filePath}`,
	}

	const result: {
		repository: {
			masterFile: { text: string } | null
			masterBlame: {
				blame: {
					ranges: {
						startingLine: number
						endingLine: number
						commit: { committedDate: string }
					}[]
				}
			} | null
			prBranch: { target: { committedDate: string } } | null
			prFile: { text: string } | null
		}
	} = await octokit.graphql(query, variables)

	const { masterFile, masterBlame, prBranch, prFile } = result.repository

	if (!masterFile?.text) {
		return null
	}

	const masterContent = masterFile.text
	const lines = masterContent.split("\n")

	const startMarker = `# start __${position}__`
	const endMarker = `# end __${position}__`

	const startIdx = lines.findIndex((line) => line.trim() === startMarker)
	const endIdx = lines.findIndex((line) => line.trim() === endMarker)

	if (startIdx === -1 || endIdx === -1) {
		return null
	}

	// Convert to 1-indexed lines, content is between markers (exclusive)
	const contentStart = startIdx + 1 + 1 // 0-based to 1-based, then +1 to skip marker line
	const contentEnd = endIdx + 1 - 1 // 0-based to 1-based, then -1 to skip marker line

	// If block is empty or PR doesn't exist, handle edge cases
	if (contentStart > contentEnd) {
		// Empty block on master — use PR if available
		if (prBranch && prFile?.text) {
			return { content: prFile.text, source: "pr" }
		}
		return { content: masterContent, source: "master" }
	}

	// Filter blame ranges to those overlapping with position content
	const blameRanges = masterBlame?.blame?.ranges ?? []
	const overlapping = blameRanges.filter(
		(range) => range.startingLine <= contentEnd && range.endingLine >= contentStart,
	)

	if (overlapping.length === 0) {
		// No blame ranges overlap — treat like empty block
		if (prBranch && prFile?.text) {
			return { content: prFile.text, source: "pr" }
		}
		return { content: masterContent, source: "master" }
	}

	const newestMasterDate = new Date(
		Math.max(...overlapping.map((r) => new Date(r.commit.committedDate).getTime())),
	)

	if (prBranch?.target?.committedDate) {
		const prTipDate = new Date(prBranch.target.committedDate)
		if (newestMasterDate >= prTipDate) {
			return { content: masterContent, source: "master" }
		}
		if (prFile?.text) {
			return { content: prFile.text, source: "pr" }
		}
	}

	return { content: masterContent, source: "master" }
}

export async function fetchFileFromBranch({
	owner,
	repo,
	filePath,
	branchName,
}: {
	owner: string
	repo: string
	filePath: string
	branchName: string
}): Promise<{ found: true; content: string } | { found: false }> {
	try {
		await octokit.git.getRef({ owner, repo, ref: `heads/${branchName}` })
	} catch {
		return { found: false }
	}

	const result = await getPreviousFileContent({ owner, repo, filePath, branchName })
	if (result.success) {
		return { found: true, content: result.previousContent }
	}
	return { found: false }
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
