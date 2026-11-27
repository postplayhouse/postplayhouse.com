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
				svelteConfig: {
					// eslint-plugin-svelte v2 always compiles components as custom
					// elements for svelte/valid-compile. This app has none, so drop
					// the custom-element-only warning.
					onwarn(warning, handler) {
						if (warning.code === "custom_element_props_identifier") return
						handler(warning)
					},
				},
			},
		},
	},
	{
		files: ["**/*.cjs"],
		rules: {
			"@typescript-eslint/no-require-imports": "off",
		},
	},
	{
		ignores: ["build/", ".svelte-kit/", ".netlify/", "package/", ".amp/"],
	},
	{
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-unused-expressions": [
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
