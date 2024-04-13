import { pathsToModuleNameMapper } from "ts-jest"
import tsConfig from "./tsconfig.json" assert { type: "json" }

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
	moduleNameMapper: pathsToModuleNameMapper(tsConfig.compilerOptions.paths),
	moduleFileExtensions: ["js", "ts", "svelte"],
	globals: {
		"ts-jest": {
			diagnostics: false,
		},
	},
}
