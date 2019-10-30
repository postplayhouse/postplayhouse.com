// This script will build svelte files out of the html and md files in _posts
// dir. Should be run as a pre-build step and also can be run with --clean to
// remove the files it generated

import * as fs from "fs"

import { mdFiles } from "../../routes/news/_posts"

mdFiles.forEach((details) => {
  const filename = `src/routes/news/${details.slug}.svelte`
  if (process.argv.includes("--clean")) {
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename)
    }
    return // don't rebuild if only cleaning
  }
  const exported = { title: details.title }
  const exportStatements = Object.keys(exported).map(
    (k) => `\n  export let ${k} = "${exported[k].replace('"', '\\"')}"`,
  )
  let additionalScriptContent = ''
  const body = details.html.replace(/^[\s\r\n]*<script>([\s\S]*?)<\/script>/, (_full, match) => {
    additionalScriptContent = match
    return ''
  })
  const script = `<script>${exportStatements}\n${additionalScriptContent}\n</script>\n\n`
  fs.writeFileSync(filename, `${script}${body}`, "utf8")
})
