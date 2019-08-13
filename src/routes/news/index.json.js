import posts from "./_posts.js";

const contents = JSON.stringify(
  posts.reverse().map(({ title, slug, date }) => ({ title, slug, date })),
);

export function get(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/json",
  });

  res.end(contents);
}
