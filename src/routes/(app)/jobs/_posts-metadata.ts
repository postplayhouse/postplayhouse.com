import { postsMetadata } from "$helpers/blog-dir-metadata"

// Everywhere Vite sees the characters `__PUBLIC_BUILD_URL__`, it replaces the
// them with the current build's actual URL. But Vite does NOT see the MD files
// that are used to generate the posts metadata above. However, it DOES see
// those same MD files when then are read into the jobs pages that are displayed
// on the website directly. So when the files are not part of a feed, they work
// just great, with Vite doing the necessary replacements. But when they are
// processed as part of a feed, they still need assistance to replace the
// "__PUBLIC_BUILD_URL__" string. So we have to do it ourselves here.
//
// Got it? Okay.
//
// So here, we have to trick Vite into NOT replacing our "sneaky string" below.
// We cannot have the string literal "__PUBLIC_BUILD_URL__" appear in the
// replacement regex, because Vite will replace it before runtime. Instead we
// need to concatenate the string so that the literal is not present in the
// source code.
//
// BUT -- There is apparently a step in Vite which optimizes certain
// instructions ahead of time, such as a simple string concatenation, which then
// allows Vite to see the literal "__PUBLIC_BUILD_URL__" and replace it. So we
// have to be sneaky and concatenate the string in a function, which Vite does
// not optimize ahead of time. This is the only way to get Vite to not replace
// the string before runtime.

/**
 * The literal string "__PUBLIC_BUILD_URL__" broken up so Vite does not see it
 * and replace it ahead of time.
 */
const sneakyUrlString = ((a, b) => a + b)("__PUBLIC_BUILD_", "URL__")
const urlMatcher = new RegExp(sneakyUrlString, "g")

export default postsMetadata("src/routes/(app)/jobs/").map((post) => ({
	...post,
	content: post.content.replaceAll(
		urlMatcher,
		// This one will be replaced by vite.config.ts during the build with the
		// desired value.
		"__PUBLIC_BUILD_URL__",
	),
}))
