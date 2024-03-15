import { error, json } from "@sveltejs/kit"
import { individualPassphraseDetails } from "../passphraseHelpers"
import { updateAndPr } from "../githubHelpers"
import site from "$data/site"
import { captureMessage } from "@sentry/sveltekit"

function toKebabCase(str: string) {
	return str
		.trim()
		.toLowerCase()
		.replace(/[^a-z]+/gi, "-")
}

export const POST = async ({ request }) => {
	const { correct, position } = individualPassphraseDetails(request)

	if (!correct) {
		return json(
			{
				error: "Invalid Passphrase",
				message: "The passphrase you gave was incorrect.",
			},
			{ status: 403 },
		)
	}

	const fd = await request.formData()
	const { bioYaml, name, imageFile, email } = Object.fromEntries(
		fd.entries(),
	) as {
		bioYaml: string
		name: string
		email: string
		imageFile?: File
	}

	if (imageFile && !(imageFile instanceof File)) {
		return json(
			{
				error: "Invalid Image",
				message: "The uploaded file is not an image.",
			},
			{ status: 400 },
		)
	}

	let imageDetails: undefined | { imageFile: File; imagePath: string }
	if (imageFile) {
		// get the file extension
		let ext = imageFile.type.split("/")[1]
		// convert jpeg to jpg
		if (ext === "jpeg") {
			ext = "jpg"
		}
		// rename the image file
		const renamedImageFile = new File(
			[imageFile],
			`${toKebabCase(name)}.${ext}`,
			{
				type: imageFile.type,
			},
		)

		imageDetails = ext
			? {
					imageFile: renamedImageFile,
					imagePath: `static/images/people/${site.season}/${toKebabCase(name)}.${ext}`,
				}
			: undefined
	}

	const markerId = `__${position}__`

	const result = await updateAndPr({
		owner: "postplayhouse",
		repo: "postplayhouse.com",
		filePath: `src/data/people/${site.season}.yml`,
		baseBranch: "master",
		commitAndPrTitle: `Bio ${position}: ${name}`,
		prBody: `Bio ${position} for ${name} (${email.replaceAll(/[@]/g, "\n\nwho lives at the domain\n\n")})`,
		...imageDetails,
		fileContent: (currentContent) => {
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
				newContent: `${currentContent.slice(0, startIdx + startTag.length)}\n${bioYaml}\n${currentContent.slice(endIdx)}`,
			}
		},
		prBranch: `bio-update/position-${position}`,
	})

	if (!result.success) {
		captureMessage(result.error)
		return error(502, { message: result.error })
	}

	return json(result)
}
