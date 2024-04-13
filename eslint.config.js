import js from "@eslint/js"
import ts from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import prettier from "eslint-config-prettier"
import globals from "globals"

// The bullshit type casting in this file is because the type definitions for
// the imported configs are not correct.

/** @typedef {import('eslint').Linter.FlatConfig} FlatConfig */

/** @type {FlatConfig[]} */
export default [
	js.configs.recommended,
	.../** @type {FlatConfig[]} */ (ts.configs.recommended),
	.../** @type {FlatConfig[]} */ (svelte.configs["flat/recommended"]),
	prettier,
	.../** @type {FlatConfig[]} */ (svelte.configs["flat/prettier"]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	{
		files: ["**/*.svelte"],
		languageOptions: {
			parserOptions: {
				parser: ts.parser,
			},
		},
	},
	{
		ignores: ["build/", ".svelte-kit/", "package/"],
	},
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"no-undef": "off",
			"svelte/no-at-html-tags": "off",
		},
	},
]
