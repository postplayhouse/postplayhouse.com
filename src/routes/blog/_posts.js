import * as fs from "fs";
import frontmatter from "frontmatter";
import MarkdownIt from "markdown-it";

const dirname = "src/routes/blog/_posts";

const posts = (() => {
  const md = new MarkdownIt({ html: true, typographer: true });
  const dir = fs.readdirSync(dirname, "utf-8");
  const files = dir
    .filter(fileName => !fileName.startsWith("."))
    .map(fileName => fs.readFileSync(`${dirname}/${fileName}`, "utf8"))
    .map(s => frontmatter(s))
    .map(f => ({ ...f.data, html: md.render(f.content) }));

  console.log({ dir, files });
  return files;
})();

export default posts;
