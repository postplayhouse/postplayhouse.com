import { dev } from "$app/environment"

const prod = !dev

// Actual values. If dev, these may change below.
const castingComplete_ = false
const showsAnnounced_ = true as boolean

export const ticketsAvailableDate = "2025-11-15T00:00:00"
export const url = "__PUBLIC_BUILD_URL__" // replaced by vite.config.ts
export const castingComplete = prod ? castingComplete_ : true
export const season = 2026 satisfies Date.Year
export const description =
	"Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse is located in historic Fort Robinson State Park."

export const boxOfficePhone = "1-888-665-1976"
export const boxOfficePhoneLink = `tel:+${boxOfficePhone.replace(/-/g, "")}`
export const showsAnnounced = prod ? showsAnnounced_ : true
export const ticketsLink = "https://postplayhouse.showare.com/"

export function ticketsAvailable() {
	return new Date() >= new Date(ticketsAvailableDate)
}

export const allYears = [
	2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
] as const

if (!allYears.includes(season)) {
	throw new Error(
		"Don't forget to add new seasons here so they appear after the next season rolls over",
	)
}
