import replacePlugin from "@rollup/plugin-replace"

const replacements = {
	"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),

	"process.env.DEPLOY_PRIME_URL": JSON.stringify(process.env.DEPLOY_PRIME_URL),

	"process.env.CONTEXT": JSON.stringify(process.env.CONTEXT),

	BUILD_TIME: JSON.stringify(new Date().toUTCString()),
}

export const replace = () =>
	replacePlugin({
		values: replacements,
		preventAssignment: true,
	})
