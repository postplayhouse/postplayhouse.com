import path from "path"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import commonjs from "@rollup/plugin-commonjs"
import url from "@rollup/plugin-url"
import svelte from "rollup-plugin-svelte"
import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import json from "@rollup/plugin-json"
import image from "svelte-image"
import config from "sapper/config/rollup.js"
import { mdsvex } from "mdsvex"
import XXhash from "xxhash"
import pkg from "./package.json"
import sveltePreprocess from "svelte-preprocess"
import typescript from "@rollup/plugin-typescript"

const mode = process.env.NODE_ENV
const dev = mode === "development"
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
  (warning.code === "MISSING_EXPORT" && /'preload'/.test(warning.message)) ||
  (warning.code === "CIRCULAR_DEPENDENCY" &&
    /[/\\]@sapper[/\\]/.test(warning.message)) ||
  warning.code === "THIS_IS_UNDEFINED" ||
  onwarn(warning)
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

const preprocess = [
  cached(
    "mdsvex",
    mdsvex({
      smartypants: true,
      extensions: [".md"],
      layout: path.join(__dirname, "./src/components/DefaultMdLayout.svelte"),
    }),
  ),
  cached(
    "image",
    image({
      optimizeAll: true, // optimize all images discovered in img tags
      inlineBelow: 10000, // inline all images in img tags below 10kb
      compressionLevel: 5, // png quality level
      quality: 50, // jpeg/webp quality level
      tagName: "Image", // default component name
      sizes: [400, 800, 1200], // array of sizes for srcset in pixels
      breakpoints: [375, 768, 1024], // array of screen size breakpoints at which sizes above will be applied
      outputDir: "g/",
      placeholder: "trace", // or "blur",
      webpOptions: {
        // WebP options [sharp docs](https://sharp.pixelplumbing.com/en/stable/api-output/#webp)
        quality: 75,
        lossless: false,
        force: true,
      },
      webp: true,
      trace: {
        // Potrace options for SVG placeholder
        background: "#fff",
        color: "#002fa7",
        threshold: 120,
      },
      processFolders: ["images/people"],
      processFoldersRecursively: true,
      processFoldersSizes: true,
    }),
  ),
  cached("autoPreprocess", sveltePreprocess()),
]

const extensions = [".svelte", ".md"]

export default {
  client: {
    input: config.client.input().replace(/\.js$/, ".ts"),
    output: config.client.output(),
    plugins: [
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        dev,
        hydratable: true,
        emitCss: true,
        preprocess,
        extensions,
      }),
      url({
        sourceDir: path.resolve(__dirname, "src/node_modules/images"),
        publicPath: "/client/",
      }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
      typescript({ sourceMap: dev }),

      legacy &&
        babel({
          extensions: [".js", ".mjs", ".html", ".svelte"],
          babelHelpers: "runtime",
          exclude: ["node_modules/@babel/**"],
          presets: [
            [
              "@babel/preset-env",
              {
                targets: "> 0.25%, not dead",
              },
            ],
          ],
          plugins: [
            "@babel/plugin-syntax-dynamic-import",
            [
              "@babel/plugin-transform-runtime",
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    preserveEntrySignatures: false,
    onwarn,
  },

  server: {
    input: { server: config.server.input().server.replace(/\.js$/, ".ts") },
    output: config.server.output(),
    plugins: [
      json(),
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        generate: "ssr",
        hydratable: true,
        dev,
        preprocess,
        extensions,
      }),
      url({
        sourceDir: path.resolve(__dirname, "src/node_modules/images"),
        publicPath: "/client/",
        emitFiles: false, // already emitted by client build
      }),
      resolve({
        dedupe: ["svelte"],
      }),
      commonjs(),
      typescript({ sourceMap: dev }),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require("module").builtinModules,
    ),

    preserveEntrySignatures: "strict",
    onwarn,
  },

  // serviceworker: {
  //   input: config.serviceworker.input().replace(/\.js$/, ".ts"),
  //   output: config.serviceworker.output(),
  //   plugins: [
  //     resolve(),
  //     replace({
  //       "process.browser": true,
  //       "process.env.NODE_ENV": JSON.stringify(mode),
  //     }),
  //     commonjs(),
  //     typescript({ sourceMap: dev }),
  //     !dev && terser(),
  //   ],

  //   preserveEntrySignatures: false,
  //   onwarn,
  // },
}
