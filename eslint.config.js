import js from "@eslint/js"
import ts from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import prettier from "eslint-config-prettier"
import globals from "globals"

// The bullshit type casting in this file is because the type definitions for
// the imported configs are not correct.

/** @typedef {import('eslint').Linter.Config} Config */

/** @type {Config[]} */
export default [
	js.configs.recommended,
	.../** @type {Config[]} */ (ts.configs.recommended),
	.../** @type {Config[]} */ (svelte.configs["flat/recommended"]),
	prettier,
	.../** @type {Config[]} */ (svelte.configs["flat/prettier"]),
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
			"@typescript-eslint/no-unused-expression": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
				},
			],
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"no-undef": "off",
			"svelte/no-at-html-tags": "off",
		},
	},
]
