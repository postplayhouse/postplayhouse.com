import * as fs from "fs"
import * as path from "path"
import matter from "gray-matter"
import { asserted } from "$helpers"

const STARTS_WITH_DATE = /^\d{4}-\d{2}-\d{2}-/

type Details = { basename: string; ext: string; content: string; date: string }

const getDetails =
	(
		directory: string,
		extensions: string[],
	): ((acc: Array<Details>, filename: string) => Array<Details>) =>
	(acc, fileName) => {
		const [basename, ext] = fileName.split("/+page.")

		if (!(basename && ext)) {
			throw new Error(
				"The basename or extension were not found for this blog article",
			)
		}

		if (extensions.indexOf(ext) === -1) {
			return acc
		}
		const content = fs.readFileSync(`${directory}/${fileName}`, "utf8")
		return [...acc, { basename, ext, content, date: basename.slice(0, 10) }]
	}

/**
 * Capitalizes the first char of the string
 */
function firstCap(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Capitalizes first char of all words, minus excluded words, if given
 */
function titleCase(s: string, exclude: string[] = []) {
	return s
		.split(" ")
		.map((word, i) =>
			exclude.includes(word) && i != 0 ? word : firstCap(word),
		)
		.join(" ")
}

/**
 */
function titleFromBasename(fileBasename: string) {
	return titleCase(fileBasename.slice(10).replace(/-/g, " ").trim())
}

function prepFiles<MapFn extends (details: Details) => Details>(
	extensions: string[],
	mapFn: MapFn,
) {
	return (dirPath: string, fileNames: string[]) =>
		fileNames
			.reduce(getDetails(dirPath, extensions), [])
			.map(mapFn) as ReturnType<MapFn>[]
}

const prepMdsvexFiles = prepFiles(["md"], (details) => {
	const frontmatter = matter(details.content)
	return {
		...details,
		...frontmatter.data,
		content: frontmatter.content,
		year: details.basename,
		title: frontmatter.data["title"] || titleFromBasename(details.basename),
	}
})

const prepSvelteFiles = prepFiles(["svelte"], (details) => {
	const match = details.content.match(
		/^\s*(export )?(const|let) title = ("|')(.*?)("|')/m,
	)
	// We only need the year and title, because the actual svelte component
	// will take over the content when it is routed.

	const title = match
		? asserted(match[4], "matched without an actual title")
		: titleFromBasename(details.basename)
	return {
		...details,
		year: details.basename,
		title: asserted(
			title,
			"title could not be derived for file " + details.basename,
		),
	}
})

function loadLegitFiles(dirPath: string) {
	return fs
		.readdirSync(dirPath, "utf-8")
		.filter((folder) => STARTS_WITH_DATE.test(folder))
		.map((folder) => {
			const files = fs
				.readdirSync(path.join(dirPath, folder))
				.filter(
					(fileName) =>
						fileName.startsWith("+page.") &&
						(fileName.endsWith(".svelte") || fileName.endsWith(".md")),
				)
			if (files.length !== 1) {
				console.log(files)
				throw new Error("Found the wrong number of files in folder " + folder)
			}

			return `${folder}/${files[0]}`
		})
}

type ArticleDetails = { year: string; title: string; updatedDate?: string }

/**
 * This will return an array of articles' metadata. Frontmatter data in md files
 * or exported title in svelte files is merged into the resulting objects as
 * well.
 *
 * @param dirPath The relative path starting at the repo root, ending
 * with a slash
 * @example postsMetadata("src/routes/(app)/news/")
 *
 */
export function postsMetadata(
	dirPath: string,
): Array<Details & ArticleDetails> {
	const thisDirBlogFiles = loadLegitFiles(dirPath)

	return prepSvelteFiles(dirPath, thisDirBlogFiles)
		.concat(prepMdsvexFiles(dirPath, thisDirBlogFiles))
		.sort((a, b) => (a.year > b.year ? 1 : -1))
}
