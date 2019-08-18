import resolve from "rollup-plugin-node-resolve"
import replace from "rollup-plugin-replace"
import commonjs from "rollup-plugin-commonjs"
import svelte from "rollup-plugin-svelte"
import babel from "rollup-plugin-babel"
import { terser } from "rollup-plugin-terser"
import json from "rollup-plugin-json"
import image from "svelte-image"
import config from "sapper/config/rollup.js"
import pkg from "./package.json"

const mode = process.env.NODE_ENV
const dev = mode === "development"
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
  (warning.code === "CIRCULAR_DEPENDENCY" &&
    /[/\\]@sapper[/\\]/.test(warning.message)) ||
  onwarn(warning)
const dedupe = (importee) =>
  importee === "svelte" || importee.startsWith("svelte/")

const imageConfig = image({optimizeAll: true, // optimize all images discovered in img tags
  inlineBelow: 10000, // inline all images in img tags below 10kb
  compressionLevel: 5, // png quality level
  quality: 50, // jpeg/webp quality level
  tagName: "Image", // default component name
  sizes: [400, 800, 1200], // array of sizes for srcset in pixels
  breakpoints: [375, 768, 1024], // array of screen size breakpoints at which sizes above will be applied
  outputDir: "g/",
  placeholder: "trace", // or "blur",
  webpOptions: { // WebP options [sharp docs](https://sharp.pixelplumbing.com/en/stable/api-output/#webp)
    quality: 75,
    lossless: false,
    force: true
  },
  webp: true,
  trace: { // Potrace options for SVG placeholder
    background: "#fff",
    color: "#002fa7",
    threshold: 120
  }})

export default {
  client: {
    input: config.client.input(),
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
        preprocess: {
          ...imageConfig,
        },
      }),
      resolve({
        browser: true,
        dedupe,
      }),
      commonjs(),

      legacy &&
        babel({
          extensions: [".js", ".mjs", ".html", ".svelte"],
          runtimeHelpers: true,
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

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      json(),
      replace({
        "process.browser": false,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      svelte({
        generate: "ssr",
        dev,
        preprocess: {
          ...imageConfig,
        },
      }),
      resolve({
        dedupe,
      }),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require("module").builtinModules ||
        Object.keys(process.binding("natives")),
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        "process.browser": true,
        "process.env.NODE_ENV": JSON.stringify(mode),
      }),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
}
