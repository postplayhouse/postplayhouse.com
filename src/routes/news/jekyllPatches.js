import { get } from "lodash";

const jekyllConfig = {
  site: {
    baseurl: "",
    css_version: 999,
    box_office_phone: "1-888-665-1976",
  },
};

// turns '{{ token }}' into 'value'
function simpleReplacer(token) {
  return [
    RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "g"),
    get(jekyllConfig, token),
  ];
}

// turns '{{ "/css/stuff.css" | prepend: token }}' into 'value/css/stuff.css'
function prependedStringReplacer(token) {
  const replacement = get(jekyllConfig, token);
  return [
    RegExp(`\\{\\{\\s*"(.*?)"\\s+\\|\\s+prepend:\\s+${token}\\s*\\}\\}`, "g"),
    (_full, _1) => {
      return `${replacement}${_1}`;
    },
  ];
}

function removeComments() {
  return [/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, ""];
}

export function replaceJekyllTokens(details) {
  details.contents = details.contents
    .replace(...simpleReplacer("site.baseurl"))
    .replace(...prependedStringReplacer("site.baseurl"))
    .replace(...simpleReplacer("site.css_version"))
    .replace(...removeComments());
  return details;
}
