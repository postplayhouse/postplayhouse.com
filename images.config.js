import svelteImage from "svelte-image"

const imagePreprocessor = svelteImage({
	optimizeAll: true, // optimize all images discovered in img tags
	inlineBelow: 10000, // inline all images in img tags below 10kb
	compressionLevel: 5, // png quality level
	quality: 50, // jpeg/webp quality level
	optimizeRemote: false,
	processFolders: [
		// These are all problem folders, where the images are not referenced in a
		// way that svelteImage understands, but still need to be present in the
		// build. Referencing them here forces the entire folder to be processed,
		// even if the reference to a given image is eventually removed. Probably
		// not a big deal, since there will be few, if any cases where that happens.
		"images/people",
		"images/perennials",
		"images/2014",
		"images/2015",
		"images/2016",
		"images/2017",
		"images/2018",
		"images/2019",
		"images/2020",
		"images/2022",
		"images/2023",
		"images/2024",
	],
	processFoldersRecursively: true,
	processFoldersSizes: true,
})

// There is some kind of race condition between the preprocessor and the adapter
// such that any images created in the `static/g/` folder aren't present on the
// first run of `npm run build`. Since this project only relies upon the
// recursive folder image processing done by svelte-image, we can just feed it
// one fake template when this file is loaded. By the time the actual adapter is
// run, the images will already be in place.
//
// This is a hack, to be sure. Perhaps when SvelteKit hits 1.0, this won't be a
// problem anymore? To reproduce the actual issue, comment out the next line
// (since it is the workaround) and run `npm run clean && npm run build`. If you
// don't get any 404 errors from prerender, then the bug is gone.
imagePreprocessor.markup({ content: "<html/>" })

export default imagePreprocessor