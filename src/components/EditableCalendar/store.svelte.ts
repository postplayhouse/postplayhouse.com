import { browser } from "$app/environment"
import { goto } from "$app/navigation"
import { writable } from "svelte/store"
import {
	showingsDataToQueryParamsObj,
	showingsStringToData,
} from "./showingsData"

let initial = {
	startingMonth: 5,
	startingYear: 2027,
	scheduleString:
		"[c6292e/Annie]B3C3D2^a3b3h3p3t2C3^g2j1m3q2u3x1y2E3^d2g1j3m2o2" +
		"[006e2b/Honky Tonk Angels/Honky Tonk]^d3e3f2i3o3r3w3^g3j2n2q1t3x3B2E2^d3f3k2m3" +
		"[e0aa36/The Addams Family/Addams]^k3l3m2q3s3v3^i2k2n3p2u2D2^a2e3g3k3n2" +
		"[1c75bc/The Drowsy Chaperone/Drowsy]^y3z3A2D3^f3j3q3w2x2B3E1^g2l3" +
		"[92278f/Footloose]^^b3c3h3i3p3v3w3A3C3D3^c3f2h2n3" +
		"[777777/Melodrama]^^o3" +
		"[777777/NEW MUSICAL]^^r2",
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
