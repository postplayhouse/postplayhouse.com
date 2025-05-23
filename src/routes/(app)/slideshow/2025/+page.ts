import { toCamel } from "$helpers"
import type { PageLoad } from "./$types"
import papa from "papaparse"

export const ssr = false

export const load: PageLoad = async ({ fetch }) => {
	const csvUrl =
		"https://docs.google.com/spreadsheets/d/1Y8jUgPY8ChSAjaFvKmvmu7-lddSfmA5kZC1Xza4vmw8/export?format=csv&id=1Y8jUgPY8ChSAjaFvKmvmu7-lddSfmA5kZC1Xza4vmw8&gid=0"
	const res = await fetch(csvUrl)
	const text = await res.text()

	// Simple CSV parsing (you might want to use a library like PapaParse for complex sheets)
	const rows = papa.parse<{
		groupName: string
		amountRange: string
		donorName: string
	}>(text, {
		header: true,
		skipEmptyLines: true,
		transformHeader(header) {
			return toCamel(header).trim()
		},
		transform(value) {
			return value.trim()
		},
	}).data

	const contributions = rows
		.map(function addMissingValuesViaOlderSibling(row, i, arr) {
			if (row.groupName === "") row.groupName = arr[i - 1].groupName
			if (row.amountRange === "") row.amountRange = arr[i - 1].amountRange
			return row
		})
		.map(function addRangeId(row) {
			const amountRangeId = row.amountRange
				.replaceAll("$", "")
				.replaceAll("–", "-")
				.replaceAll("+", "")
				.replaceAll("-", "")
				.toLowerCase()
			const groupNameId = row.groupName.replaceAll(/\W/g, "").toLowerCase()
			return { ...row, amountRangeId, groupNameId }
		})
		.map(function addSlideGroup(row) {
			let slideGroup: "special" | "large" | "small"
			if (row.groupNameId.startsWith("special")) {
				slideGroup = "special"
			} else if (
				["100-249", "250-499", "500-999"].includes(row.amountRangeId)
			) {
				slideGroup = "small"
			} else {
				slideGroup = "large"
			}
			return { ...row, slideGroup }
		})

	type Group = { title: string; names: string[] }
	const slideData = {
		special: [] as Group[],
		large: [] as Group[],
		small: [] as Group[],
	}

	let currentGroup: Group = { title: "", names: [] }
	for (const item of contributions) {
		const slideGroup = slideData[item.slideGroup]
		if (item.amountRange !== currentGroup.title) {
			currentGroup = { title: item.amountRange, names: [] }
			slideGroup.push(currentGroup)
		}
		currentGroup?.names.push(item.donorName)
	}

	return { slideData }
}
