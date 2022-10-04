import path from "path"
import { sveltekit } from "@sveltejs/kit/vite"
import WatchAndRun from "vite-plugin-watch-and-run"

import replace from "@rollup/plugin-replace"
import { replacements } from "./svelte.config"

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    replace({
      values: replacements.reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {},
      ),
      preventAssignment: true,
    }),
    WatchAndRun([
      {
        watch: "**/src/data/**/*.yml",
        run: "touch ./src/data/_yaml.ts",
      },
    ]),
    sveltekit(),
  ],
  resolve: {
    alias: {
      $components: path.resolve("./src/components"),
      $data: path.resolve("./src/data"),
      $helpers: path.resolve("./src/helpers"),
      $models: path.resolve("./src/models"),
    },
  },
}

export default config
