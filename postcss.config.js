const prod = process.env.NODE_ENV === "production"

const tailwindcss = require("tailwindcss")

const purgecss = require("@fullhuman/postcss-purgecss")({
  content: ["./src/**/*.svelte", "./src/**/*.md", "./src/**/*.html"],
  defaultExtractor: (content) => content.match(/[A-Za-z0-9-_:/]+/g) || [],
})

const cssNano = require("cssnano")({ preset: "default" })

module.exports = {
  plugins: [
    tailwindcss("./tailwind.js"),
    require("autoprefixer"),
    prod && purgecss,
    prod && cssNano,
  ].filter(Boolean),
}
