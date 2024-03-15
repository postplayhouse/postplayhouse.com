module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:svelte/recommended",
		"plugin:svelte/prettier",
		"prettier",
	],
	plugins: ["@typescript-eslint"],
	ignorePatterns: ["*.cjs"],
	overrides: [
		{
			files: ["*.svelte"],
			parser: "svelte-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},
		{
			files: ["**/*.test.{js,ts}"],
			env: { jest: true },
		},
	],
	parserOptions: {
		project: "./tsconfig.json",
		extraFileExtensions: [".svelte"],
		sourceType: "module",
		ecmaVersion: 2020,
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
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
}
