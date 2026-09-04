export const season = 2027

const firstWebsiteSeason = 2015
export const allYears = Array.from(
	{ length: season - firstWebsiteSeason + 1 },
	(_, index) => firstWebsiteSeason + index,
) as [number, ...number[]]

const yearsWithCalendars = allYears.filter((y) => y >= 2020)

export const entries: Exclude<
	import("@sveltejs/kit").KitConfig["prerender"],
	undefined
>["entries"] = [
	"*",
	...allYears.map((y) => `/productions/${y}` as const),
	...allYears.filter((y) => y !== season).map((y) => `/who/${y}` as const),
	...yearsWithCalendars.map((y) => `/calendar/${y}` as const),
]
