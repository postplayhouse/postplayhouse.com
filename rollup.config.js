import path from "path"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import commonjs from "@rollup/plugin-commonjs"
import url from "@rollup/plugin-url"
import svelte from "rollup-plugin-svelte"
import babel from "@rollup/plugin-babel"
import { terser } from "rollup-plugin-terser"
import json from "@rollup/plugin-json"
import config from "sapper/config/rollup.js"
import pkg from "./package.json"
import typescript from "@rollup/plugin-typescript"

// file needs to be commonjs so must import as such
const svelteClientConfig = require("./svelte.config.runtime")

const mode = process.env.NODE_ENV
const dev = mode === "development"
const legacy = !!process.env.SAPPER_LEGACY_BUILD

const onwarn = (warning, onwarn) =>
  (warning.code === "MISSING_EXPORT" && /'preload'/.test(warning.message)) ||
  (warning.code === "CIRCULAR_DEPENDENCY" &&
    /[/\\]@sapper[/\\]/.test(warning.message)) ||
  warning.code === "THIS_IS_UNDEFINED" ||
  onwarn(warning)

const envVars = {
  BROWSER: "true",
  "process.env.NODE_ENV": JSON.stringify(mode),
  "process.env.DEPLOY_PRIME_URL": JSON.stringify(process.env.DEPLOY_PRIME_URL),
  "process.env.CONTEXT": JSON.stringify(process.env.CONTEXT), // `production`, `deploy-preview` or `branch-deploy`
}

export default {
  client: {
    input: config.client.input().replace(/\.js$/, ".ts"),
    output: config.client.output(),
    plugins: [
      replace(envVars),

      svelte(svelteClientConfig),
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
      replace({ ...envVars, BROWSER: "false" }),
      svelte({
        generate: "ssr",
        ...svelteClientConfig,
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
