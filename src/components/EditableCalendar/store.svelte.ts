import { browser } from "$app/environment"
import { goto } from "$app/navigation"
import { writable } from "svelte/store"
import {
	showingsDataToQueryParamsObj,
	showingsStringToData,
} from "./showingsData"

let initial = {
	startingMonth: 5,
	startingYear: 2023,
	scheduleString:
		"[006e2b/Show 1/1]z3A3B2D3^f3n3r2B3^f3h3l3p2t3v2z2C3^c3i3l3" +
		"[1c75bc/Show 2/2]^b3c3d2g3m3p3u3A3^e3h2l2n3o1u3z3C2^a3e3f2k2" +
		"[e0aa36/Show 3/3]^i3j3k2o3q3t3^d3g3h1o2r3v1w2B2D2^d2h3l2" +
		"[92278f/Show 4/4]^w3x3y2^a2e2i2m3s2v3B3C1^b3d3e1i2k3" +
		"[c6292e/Show 5/5]^D3^a3b2g2k3n2o3s3u2y3A3^b2e2j3m1",
}

const schedule = showingsStringToData(initial.scheduleString, {
	startingMonth: initial.startingMonth,
	startingYear: initial.startingYear,
})

const scheduleStore = writable(schedule)

function updateUrl(newSchedule: typeof schedule) {
	const url = new URL(window.location.toString())
	for (const [param, val] of Object.entries(
		showingsDataToQueryParamsObj(newSchedule),
	)) {
		url.searchParams.set(param, String(val))
	}
	const lenientUrl =
		url.origin +
		url.pathname +
		url.search
			.replaceAll("%20", "+")
			.replaceAll("%5B", "[")
			.replaceAll("%5D", "]")
			.replaceAll("%2F", "/")
			.replaceAll("%5E", "^")

	goto(lenientUrl, { noScroll: true, keepFocus: true })
}

scheduleStore.subscribe((newSchedule) => {
	browser && updateUrl(newSchedule)
})

export function replaceAfterMount() {
	if (browser) {
		const params = new URL(window.location.href).searchParams
		const [year, month] = (
			params.get("start") || `${initial.startingYear}-${initial.startingMonth}`
		)
			.split("-")
			.map(Number)

		initial = {
			startingMonth: month ?? initial.startingMonth,
			startingYear: year ?? initial.startingYear,
			scheduleString: params.get("schedule") ?? initial.scheduleString,
		}

		const { scheduleString, ...rest } = initial

		scheduleStore.set(showingsStringToData(scheduleString, rest))
	}
}

export default scheduleStore
