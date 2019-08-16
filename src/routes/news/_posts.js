import * as fs from "fs"
import * as path from "path"
import frontmatter from "frontmatter"
import MarkdownIt from "markdown-it"

import { replaceJekyllTokens } from "./jekyllPatches"

const postsDirname = "src/routes/news/_posts"
const thisDirname = path.join(postsDirname, "..")

const STARTS_WITH_NUM = /^[0-9]/
const md = new MarkdownIt({ html: true, typographer: true })

const postsDirFiles = fs.readdirSync(postsDirname, "utf-8")
const thisDirFiles = fs.readdirSync(thisDirname, "utf-8")

const getDetails = (directory, ...extensions) => (acc, fileName) => {
  const [basename, ext] = fileName.split(".")
  if (extensions.indexOf(ext) === -1) {
    return acc
  }
  const contents = fs.readFileSync(`${directory}/${fileName}`, "utf8")
  return [...acc, { basename, ext, contents, date: basename.slice(0, 10) }]
}

const mdFiles = postsDirFiles
  .reduce(getDetails(postsDirname, "md", "html"), [])
  .map(replaceJekyllTokens)
  .map((details) => {
    const fm = frontmatter(details.contents)
    return {
      ...details,
      ...fm.data,
      slug: details.basename,
      html: details.ext === "md" ? md.render(fm.content) : fm.content,
      // html: fm.content,
    }
  })

const svelteFiles = thisDirFiles
  .reduce(getDetails(thisDirname, "svelte"), [])
  .filter((details) => STARTS_WITH_NUM.test(details.basename))
  .map((details) => {
    const [_full, _1, _2, title] = details.contents.match(
      /^\s*export (const|let) title = ("|')(.*?)("|')/m,
    )
    // We only need the slug and title, because the actual svelte component
    // will take over the content when it i routed.
    return {
      ...details,
      slug: details.basename,
      title: title ? title : details.basename,
    }
  })

const posts = svelteFiles
  .concat(mdFiles)
  .sort((a, b) => (a.slug > b.slug ? 1 : -1))

export default posts
