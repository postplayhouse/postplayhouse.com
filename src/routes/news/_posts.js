import * as fs from "fs";
import * as path from "path";
import frontmatter from "frontmatter";
import MarkdownIt from "markdown-it";

const dirname = "src/routes/news/_posts";
const parentDir = path.join(dirname, "..");

const STARTS_WITH_NUM = /^[0-9]/;
const md = new MarkdownIt({ html: true, typographer: true });

const posts = (() => {
  const mdFileNames = fs.readdirSync(dirname, "utf-8");
  const svelteFileNames = fs
    .readdirSync(parentDir, "utf-8")
    .filter(fileName => STARTS_WITH_NUM.test(fileName));
  const files = mdFileNames
    .concat(svelteFileNames)
    .sort()
    .filter(fileName => !fileName.startsWith("."))
    .map(fileName => {
      const [basename, ext] = fileName.split(".");
      if (ext === "md" || ext === "html") {
        const contents = fs.readFileSync(`${dirname}/${fileName}`, "utf8");

        const fm = frontmatter(contents);
        return {
          ...fm.data,
          slug: basename,
          html: ext === "md" ? md.render(fm.content) : fm.content,
        };
      } else {
        const contents = fs.readFileSync(`${parentDir}/${fileName}`, "utf-8");
        const [_full, _1, _2, title] = contents.match(
          /^\s*export (const|let) title = ("|')(.*?)("|')/m,
        );
        return { slug: basename, title: title ? title : basename };
      }
    });

  console.log({ dir: mdFileNames, files });
  return files;
})();

export default posts;
