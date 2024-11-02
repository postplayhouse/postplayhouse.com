import { generate } from "random-words"

const words = /** @type {string[]} */ (
	generate({
		exactly: 70,
		wordsPerString: 2,
		minLength: 4,
		separator: "_",
	})
)

console.log(words.join(","))
console.log()
console.log()
console.log(
	words
		.map((x) => `${x} →`)
		.join("\n")
		.replace(/_/g, " "),
)
