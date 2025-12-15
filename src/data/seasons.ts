export const season = 2026 satisfies Date.Year

export const allYears = [
	2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
] as const

if (!allYears.includes(season)) {
	throw new Error(
		"Don't forget to add new seasons here so they appear after the next season rolls over",
	)
}

const yearsWithCalendars = allYears.filter((y) => y >= 2020)

export const entries: Exclude<
	import("@sveltejs/kit").KitConfig["prerender"],
	undefined
>["entries"] = [
	"*",
	...allYears.map((y) => `/productions/${y}` as const),
	...allYears.map((y) => `/who/${y}` as const),
	...yearsWithCalendars.map((y) => `/calendar/${y}` as const),
]
