import { get } from "lodash"
import data from "../../data"

const jekyllConfig = {
  site: {
    baseurl: "",
    url: "https://postplayhouse.com", // for prod...
    css_version: 999,
    box_office_phone: "1-888-665-1976",
    data,
  },
}

// turns '{{ token }}' into 'value'
const simpleReplacer = [
  /\{\{\s*([a-z._]*?)\s*\}\}/g,
  (_full, _1) => get(jekyllConfig, _1),
]

// turns '{{ "/css/stuff.css" | prepend: token }}' into 'value/css/stuff.css'
const prependedStringReplacer = [
  /\{\{\s*"(.*?)"\s+\|\s+prepend:\s+([a-z._]*?)\s*\}\}/g,
  (_full, _1, _2) => {
    return `${get(jekyllConfig, _2)}${_1}`
  },
]

const removeComments = [
  /\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g,
  "",
]

const dataReplace = [
  /\{\{\s*(site\.data.*?)(\s*\|\s*markdownify)?\s*\}\}/g,
  (_full, _1, _2) => {
    return get(jekyllConfig, _1)
  },
]

export function replaceJekyllTokens(details) {
  details.contents = details.contents
    .replace(...simpleReplacer)
    .replace(...prependedStringReplacer)
    .replace(...removeComments)
    .replace(...dataReplace)

    // This one is just for testing
    .replace(/\/(images|css)\//g, "https://postplayhouse.com/$1/")
  return details
}
