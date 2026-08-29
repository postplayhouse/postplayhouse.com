import { dev } from "$app/environment"

export { season, allYears } from "./seasons"

const prod = !dev

// Actual values. If dev, these may change below.
const castingComplete_ = false as boolean
const showsExistInYaml_ = false as boolean
const showsAnnounced_ = false as boolean

export const ticketsAvailableDate = "2026-11-15T00:00:00"
const dayAfterFinalPerf = "2027-08-10T00:00:00"
export const url = "__PUBLIC_BUILD_URL__" // replaced by vite.config.ts
export const castingComplete = prod ? castingComplete_ : true
export const description =
	"Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse is located in historic Fort Robinson State Park."

export const boxOfficePhone = "1-888-665-1976"
export const boxOfficePhoneLink = `tel:+${boxOfficePhone.replace(/-/g, "")}`
export const showsAnnounced = prod ? showsAnnounced_ : showsExistInYaml_
export const ticketsLink = "https://postplayhouse.showare.com/"

export function ticketsAvailable() {
	return new Date() >= new Date(ticketsAvailableDate)
}
export function seasonEnded() {
	return (
		new Date() >= new Date(ticketsAvailableDate) &&
		new Date() >= new Date(dayAfterFinalPerf)
	)
}
