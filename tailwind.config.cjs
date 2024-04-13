/* eslint-disable @typescript-eslint/no-var-requires */
const typography = require("@tailwindcss/typography")

/** @type {import('tailwindcss').Config}*/
const config = {
	content: ["./src/**/*.{html,js,svelte,ts}"],

	theme: {
		extend: {},
	},

	plugins: [typography],
}

module.exports = config
