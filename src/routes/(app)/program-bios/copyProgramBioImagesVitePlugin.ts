import fs from "node:fs"
import path from "node:path"

export function copyProgramBioImages(source: string, output: string) {
	fs.cpSync(source, output, { recursive: true })
}

export default {
	name: "copy-program-bio-images",
	writeBundle(options: { dir?: string }) {
		if (!options.dir || path.basename(options.dir) !== "client") return

		copyProgramBioImages(
			path.resolve("src/images/people"),
			path.join(options.dir, "images/people"),
		)
	},
}
