import type { PageLoad } from "./$types"
import papa from "papaparse"

export const load: PageLoad = async ({ fetch }) => {
	const csvUrl =
		"https://docs.google.com/spreadsheets/d/1Y8jUgPY8ChSAjaFvKmvmu7-lddSfmA5kZC1Xza4vmw8/export?format=csv&id=1Y8jUgPY8ChSAjaFvKmvmu7-lddSfmA5kZC1Xza4vmw8&gid=0"
	const res = await fetch(csvUrl)
	const text = await res.text()

	// Simple CSV parsing (you might want to use a library like PapaParse for complex sheets)
	const rows = papa.parse<{
		"Group Name": string
		"Amount Range": string
		"Donor Name": string
	}>(text, { header: true }).data

	const data = rows.reduce(
		(acc, row, i) => {
			if (row["Group Name"] === "") row["Group Name"] = acc[i - 1]["Group Name"]
			if (row["Amount Range"] === "")
				row["Amount Range"] = acc[i - 1]["Amount Range"]
			acc.push(row)
			return acc
		},
		[] as typeof rows,
	)

	const data2 = data.map((row) => {
		let slideGroup: "special" | "large" | "small"
		if (row["Group Name"].includes("Special")) {
			slideGroup = "special"
		} else if (
			["100-249", "250-499", "500-999"].includes(
				row["Amount Range"].replaceAll("$", "").replaceAll("–", "-").trim(),
			)
		) {
			slideGroup = "small"
		} else {
			slideGroup = "large"
		}
		return { ...row, slideGroup }
	})

	type Group = { title: string; names: string[] }
	const data3 = {
		special: [] as Group[],
		large: [] as Group[],
		small: [] as Group[],
	}

	let currentGroup: Group = { title: "", names: [] }
	for (const person of data2) {
		const slideGroup = data3[person.slideGroup]
		if (person["Amount Range"] !== currentGroup.title) {
			currentGroup = { title: person["Amount Range"], names: [] }
			slideGroup.push(currentGroup)
		}
		currentGroup?.names.push(person["Donor Name"])
	}

	return { donors: data3 }
}
