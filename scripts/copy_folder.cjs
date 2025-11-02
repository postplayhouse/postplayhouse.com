#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const promisify = require("util").promisify

/**
 * @param str {string|undefined}
 */
function helpAndExit(str = "") {
	console.log(
		str +
			`
This command will copy an entire folder from one location to another, with recursion.

copy_folder [--save|--merge] ../some/path --to ./another/place

The above "path" folder will be renamed to "place"

  --save [folder location]   specifying "save" will overwrite the destination
  --merge [folder location]  specifying "merge" will merge with the destination
  --to [folder location]     the destination
`,
	)
	process.exit(help ? 0 : 1)
}

/**
 * @param arr {Array}
 */
function flatten(arr) {
	return arr.reduce((a, c) => (Array.isArray(c) ? [...a, ...c] : [...a, c]))
}
const argv = flatten(process.argv.slice(2).map((str) => str.split("=")))

const merge = argv.indexOf("--merge")
const save = argv.indexOf("--save")
const to = argv.indexOf("--to")
const help = argv.includes("--help") || argv.includes("-h")

let incorrectArgs = (merge === -1 && save === -1) || to === -1

if (help) helpAndExit()

if (merge > -1 && save > -1) {
	helpAndExit("You cannot include both --merge and --save. See help:")
}

const action = merge > -1 ? "merge" : "save"

if (incorrectArgs)
	helpAndExit(
		"You called the command without the proper arguments. See help:\n\n",
	)

const from = argv[(action === "merge" ? merge : save) + 1]
const sendTo = argv[to + 1]

/**
 * @param str {string|undefined}
 */
const isNotValue = (str) =>
	str.startsWith("-") || str === "" || str === undefined

if (isNotValue(from) || isNotValue(sendTo)) {
	helpAndExit(
		"You didn't provide the correct arguments to one of the named inputs. Either `--merge` or `--save` must be a path. And `--to` must also always be a path.",
	)
}

/**
 * @param pathpart {string}
 */
const isNotFolder = (pathpart) =>
	!(fs.existsSync(pathpart) && fs.statSync(pathpart).isDirectory())

if (isNotFolder(from)) {
	console.log(`The --${action} path is not pointing to a folder.`)
	process.exit(1)
}

try {
	fs.mkdirSync(sendTo, { recursive: true })
} catch (_) {
	helpAndExit(`Could not make the directory ${sendTo}`)
}

const unlink = promisify(fs.unlink)

/**
 * @param directory {string}
 */
function rimrafContents(directory, options = {}) {
	!options.noConsole && console.log(`cleaning out directory ${directory}`)
	try {
		const all = fs.readdirSync(directory)
		const folders = all.filter((x) =>
			fs.statSync(path.join(directory, x)).isDirectory(),
		)
		const files = all.filter((x) => !folders.includes(x))
		const unlinkFiles = files.map((filename) =>
			unlink(path.join(directory, filename)),
		)
		const emptyFolders = folders.map((folder) =>
			rimrafContents(path.join(directory, folder), { noConsole: true }),
		)
		return Promise.all(flatten([unlinkFiles, emptyFolders]))
	} catch (err) {
		console.error(err)
		process.exit(1)
	}
}

const copyFile = promisify(fs.copyFile)

/**
 * @param oldFolder {string}
 * @param newFolder {string}
 */
function recursiveCopyFiles(oldFolder, newFolder) {
	console.log(`copying everything from ${oldFolder} to ${newFolder}`)
	fs.mkdirSync(newFolder, { recursive: true })

	const all = fs.readdirSync(oldFolder)
	const folders = all.filter((x) =>
		fs.statSync(path.join(oldFolder, x)).isDirectory(),
	)
	const files = all.filter((x) => !folders.includes(x))

	const copyingFiles = files.map((file) =>
		copyFile(
			path.join(oldFolder, file),
			path.join(newFolder, file),
			fs.constants.COPYFILE_EXCL,
		).catch(() => {}),
	)
	const copyingFolders = folders.map((subfolder) =>
		recursiveCopyFiles(
			path.join(oldFolder, subfolder),
			path.join(newFolder, subfolder),
		),
	)

	return Promise.all(flatten([copyingFiles, copyingFolders]))
}

;(async function () {
	if (action === "save") {
		// we want to overwrite the destination
		await rimrafContents(sendTo)
	}
	recursiveCopyFiles(from, sendTo)
})()
