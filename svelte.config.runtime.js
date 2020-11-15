const XXhash = require("xxhash")
const image = require("svelte-image")
const baseConfig = require("./svelte.config")

const cache = {}

function cached(name, obj) {
  return {
    ...obj,
    markup: ({ content, filename }) => {
      const key = `${name}:${filename}`

      if (
        cache[key] &&
        XXhash.hash(Buffer.from(content, "utf8"), 0xcafebabe) ===
          cache[key].hash
      ) {
        return cache[key].result
      }

      const result = obj.markup({ content, filename })

      cache[key] = {
        hash: XXhash.hash(Buffer.from(content, "utf8"), 0xcafebabe),
        result,
      }

      return result
    },
  }
}

function preprocessorPlug(x) {
  if (x.name === "svelteImage") {
    x.makeProcessor = image
  }

  const { makeProcessor } = x
  x.makeProcessor = (config) => cached(x.name, makeProcessor(config))

  return x
}

module.exports = baseConfig.___createPostPlayhouseRuntimeConfig({
  preprocessorPlug,
})
