import { get } from "lodash"
import data from "../../data"

const prod = process.env.NODE_ENV === "production"

// Actual values. If dev, these may change below.
const castingComplete = false

// All of this "site" data should eventually be moved to a better place for
// Sapper. For now, for backward compatibility, it is all just here.
const legacyData = {
  site: {
    baseurl: "",
    url: prod ? "https://postplayhouse.com" : "",
    css_version: 999,
    maintainer_email: "don@postplayhouse.com",
    icon: "/images/post-playhouse-logo.png",
    title: "Post Playhouse",
    twitter: "postplayhouse",
    facebook: "post.playhouse",
    casting_complete: prod ? castingComplete : true,
    season: 2020,
    description:
      "Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse, Inc. performs its productions at the theatre in Fort Robinson State Park.",
    box_office_phone: "1-888-665-1976",
    data,
  },
}

// replaces '{{ token }}' with the value associated value from `legacyData`
const simpleReplacer = [
  /\{\{\s*([a-z._]*?)\s*\}\}/g,
  (_full, _1) => get(legacyData, _1),
]

// turns '{{ "/css/stuff.css" | prepend: token }}' into 'value/css/stuff.css'
const prependedStringReplacer = [
  /\{\{\s*"(.*?)"\s+\|\s+prepend:\s+([a-z._]*?)\s*\}\}/g,
  (_full, _1, _2) => {
    return `${get(legacyData, _2)}${_1}`
  },
]

const removeComments = [
  /\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g,
  "",
]

// replaces '{{ site.data.some_data_value.even.if.nested }}' with the associated
// value from `legacyData`
const dataReplace = [
  /\{\{\s*(site\.data.*?)(\s*\|\s*markdownify)?\s*\}\}/g,
  (_full, _1, _2) => {
    return get(legacyData, _1)
  },
]

export function replaceJekyllTokens(details) {
  details.contents = details.contents
    .replace(...simpleReplacer)
    .replace(...prependedStringReplacer)
    .replace(...removeComments)
    .replace(...dataReplace)

    // This one is just for testing. It references all the images in their
    // original location on the web instead of their local location. It should
    // be removed once images can be referenced locally.
    .replace(/\/(images|css)\//g, "https://postplayhouse.com/$1/")
  return details
}
