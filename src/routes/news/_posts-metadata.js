import * as fs from "fs"
import frontmatter from "frontmatter"

const thisDirname = "src/routes/news/"

const STARTS_WITH_NUM = /^[0-9]/

const thisDirFiles = fs.readdirSync(thisDirname, "utf-8")

/**
 *
 * @param {string} directory
 * @param {...string} extensions
 * @typedef {{basename: string, ext: string, contents: string, date: string}} Details
 * @returns {(acc: Array<Details>, filename: string) => Array<Details>}
 */
const getDetails = (directory, ...extensions) => (acc, fileName) => {
  const [basename, ext] = fileName.split(".")
  if (extensions.indexOf(ext) === -1) {
    return acc
  }
  const contents = fs.readFileSync(`${directory}/${fileName}`, "utf8")
  return [...acc, { basename, ext, contents, date: basename.slice(0, 10) }]
}

const mdsvexFiles = thisDirFiles
  .reduce(getDetails(thisDirname, "md"), [])
  .map((details) => {
    const fm = frontmatter(details.contents)
    return {
      ...details,
      ...fm.data,
      slug: details.basename,
      title: fm.data.title ? fm.data.title : details.basename,
    }
  })

const svelteFiles = thisDirFiles
  .reduce(getDetails(thisDirname, "svelte"), [])
  .filter((details) => STARTS_WITH_NUM.test(details.basename))
  .map((details) => {
    const match = details.contents.match(
      /^\s*(export )?(const|let) title = ("|')(.*?)("|')/m,
    )
    // We only need the slug and title, because the actual svelte component
    // will take over the content when it is routed.
    return {
      ...details,
      slug: details.basename,
      title: match ? match[4] : details.basename,
    }
  })

const posts = svelteFiles
  .concat(mdsvexFiles)
  .sort((a, b) => (a.slug > b.slug ? 1 : -1))

export default posts
