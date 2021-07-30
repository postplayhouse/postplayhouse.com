/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.svelte$": [
      "svelte-jester",
      {
        preprocess: true,
      },
    ],
    "^.+\\.ts$": "ts-jest",
  },
  moduleFileExtensions: ["js", "ts", "svelte"],
  globals: {
    "ts-jest": {
      diagnostics: false,
    },
  },
}
