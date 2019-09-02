import * as fs from "fs"
import * as path from "path"
import frontmatter from "frontmatter"
import MarkdownIt from "markdown-it"

import { replaceJekyllTokens } from "../../data"

const postsDirname = "src/routes/news/_posts"
const thisDirname = path.join(postsDirname, "..")

const STARTS_WITH_NUM = /^[0-9]/
const md = new MarkdownIt({ html: true, typographer: true })

const postsDirFiles = fs.readdirSync(postsDirname, "utf-8")
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

/**
 * @type {Array<Details & {slug: string, html: string, title: string, [x: string]: string}>}
 */
export const mdFiles = postsDirFiles
  .reduce(getDetails(postsDirname, "md", "html"), [])
  .map(replaceJekyllTokens)
  .map((details) => {
    const fm = frontmatter(details.contents)
    return {
      ...details,
      ...fm.data,
      slug: details.basename,
      html: details.ext === "md" ? md.render(fm.content) : fm.content,
    }
  })

const svelteFiles = thisDirFiles
  .reduce(getDetails(thisDirname, "svelte"), [])
  .filter((details) => STARTS_WITH_NUM.test(details.basename))
  .map((details) => {
    const match = details.contents.match(
      /^\s*(export )?(const|let) title = ("|')(.*?)("|')/m,
    )
    const title = match ? match[4] : details.basename
    // We only need the slug and title, because the actual svelte component
    // will take over the content when it is routed.
    return {
      ...details,
      slug: details.basename,
      title,
    }
  })

const posts = svelteFiles
// .concat will add mdFiles, but filtered against the slugs of the svelte files.
// If the transpile step happens, then all of the mdFiles will likely be
// filtered out, since they will now exist as svelteFiles.
  .concat(mdFiles.filter(mdFile => svelteFiles.map(s => s.slug).indexOf(mdFile.slug) === -1))
  .sort((a, b) => (a.slug > b.slug ? 1 : -1))

export default posts
