import * as fs from "fs"
import frontmatter from "frontmatter"

const STARTS_WITH_DATE = /^\d{4}-\d{2}-\d{2}-/

/**
 *
 * @param {string} directory
 * @param {string[]} extensions
 * @typedef {{basename: string, ext: string, content: string, date: string}} Details
 * @returns {(acc: Array<Details>, filename: string) => Array<Details>}
 */
const getDetails = (directory, extensions) => (acc, fileName) => {
  const [basename, ext] = fileName.split(".")
  if (extensions.indexOf(ext) === -1) {
    return acc
  }
  const content = fs.readFileSync(`${directory}/${fileName}`, "utf8")
  return [...acc, { basename, ext, content, date: basename.slice(0, 10) }]
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
  const fm = frontmatter(details.content)
  return {
    ...details,
    ...fm.data,
    content: fm.content,
    year: details.basename,
    title: fm.data.title || titleFromBasename(details.basename),
  }
})

const prepSvelteFiles = prepFiles(["svelte"], (details) => {
  const match = details.content.match(
    /^\s*(export )?(const|let) title = ("|')(.*?)("|')/m,
  )
  // We only need the year and title, because the actual svelte component
  // will take over the content when it is routed.
  return {
    ...details,
    year: details.basename,
    title: match ? match[4] : titleFromBasename(details.basename),
  }
})

function loadLegitFiles(dirPath) {
  return fs
    .readdirSync(dirPath, "utf-8")
    .filter((fileName) => STARTS_WITH_DATE.test(fileName))
}

/**
 * This will return an array of articles' metadata. Frontmatter data in md files
 * or exported title in svelte files is merged into the resulting objects as
 * well.
 *
 * @param {string} dirPath The relative path starting at the repo root, ending
 * with a slash
 * @typedef {{year: string, title: string}} ArticleDetails
 * @returns {Array<Details & ArticleDetails>}
 * @example postsMetadata("src/routes/news/")
 *
 */
export function postsMetadata(dirPath) {
  const thisDirBlogFiles = loadLegitFiles(dirPath)

  return prepSvelteFiles(dirPath, thisDirBlogFiles)
    .concat(prepMdsvexFiles(dirPath, thisDirBlogFiles))
    .sort((a, b) => (a.year > b.year ? 1 : -1))
}
