import * as fs from "fs"
import frontmatter from "frontmatter"

const STARTS_WITH_DATE = /^\d{4}-\d{2}-\d{2}-/

/**
 *
 * @param {string} directory
 * @param {string[]} extensions
 * @typedef {{basename: string, ext: string, contents: string, date: string}} Details
 * @returns {(acc: Array<Details>, filename: string) => Array<Details>}
 */
const getDetails = (directory, extensions) => (acc, fileName) => {
  const [basename, ext] = fileName.split(".")
  if (extensions.indexOf(ext) === -1) {
    return acc
  }
  const contents = fs.readFileSync(`${directory}/${fileName}`, "utf8")
  return [...acc, { basename, ext, contents, date: basename.slice(0, 10) }]
}

/**
 * Capitalizes the first char of the string
 * @param {string} s
 * @returns {string}
 */
function firstCap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Capitalizes first char of all words, minus excluded words, if given
 * @param {string} s
 * @param {string[]?} exclude
 * @returns {string}
 */
function titleCase(s, exclude = []) {
  return s
    .split(" ")
    .map((word, i) =>
      exclude.includes(word) && i != 0 ? word : firstCap(word),
    )
    .join(" ")
}

/**
 *
 * @param {string} fileBasename
 * @returns {string}
 */
function titleFromBasename(fileBasename) {
  return titleCase(fileBasename.slice(10).replace(/-/g, " ").trim())
}

/**
 *
 * @param {string[]} extensions
 * @param {(details: Details) => any} mapFn
 * @returns {(dirPath: string, fileNames: string[]) => any}
 */
const prepFiles = (extensions, mapFn = (x) => x) => (dirPath, fileNames) =>
  fileNames.reduce(getDetails(dirPath, extensions), []).map(mapFn)

const prepMdsvexFiles = prepFiles(["md"], (details) => {
  const fm = frontmatter(details.contents).data
  return {
    ...details,
    ...fm,
    slug: details.basename,
    title: fm.title || titleFromBasename(details.basename),
  }
})

const prepSvelteFiles = prepFiles(["svelte"], (details) => {
  const match = details.contents.match(
    /^\s*(export )?(const|let) title = ("|')(.*?)("|')/m,
  )
  // We only need the slug and title, because the actual svelte component
  // will take over the content when it is routed.
  return {
    ...details,
    slug: details.basename,
    title: match ? match[4] : titleFromBasename(details.basename),
  }
})

/**
 * This will return an array of articles' metadata. Frontmatter data in md files
 * or exported title in svelte files is merged into the resulting objects as
 * well.
 *
 * @param {string} dirPath The realtive path starting at the repo root, ending
 * with a slash
 * @typedef {{slug: string, title: string}} ArticleDetails
 * @returns {Array<Details & ArticleDetails>}
 * @example postsMetadata("src/routes/news/")
 *
 */
export function postsMetadata(dirPath) {
  const thisDirBlogFiles = fs
    .readdirSync(dirPath, "utf-8")
    .filter((fileName) => STARTS_WITH_DATE.test(fileName))

  return prepSvelteFiles(dirPath, thisDirBlogFiles)
    .concat(prepMdsvexFiles(dirPath, thisDirBlogFiles))
    .sort((a, b) => (a.slug > b.slug ? 1 : -1))
}
