import { dev } from "$app/environment"

export { season, allYears } from "./seasons"

const prod = !dev

// Actual values. If dev, these may change below.
const castingComplete_ = false as boolean
const showsExistInYaml_ = true as boolean
const showsAnnounced_ = true as boolean

// Midnight Eastern; the offset keeps it from shifting with the visitor's timezone.
// Use -05:00 for standard time and -04:00 for dates during daylight saving time.
export const ticketsAvailableDate: string | null = "2026-11-27T00:00:00-05:00"
const dayAfterFinalPerf = "2027-08-16T00:00:00"
export const url = "__PUBLIC_BUILD_URL__" // replaced by vite.config.ts
export const castingComplete = prod ? castingComplete_ : true
export const description =
	"Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse is located in historic Fort Robinson State Park."

export const boxOfficePhone = "1-888-665-1976"
export const boxOfficePhoneLink = `tel:+${boxOfficePhone.replace(/-/g, "")}`
export const showsAnnounced = prod ? showsAnnounced_ : showsExistInYaml_
export const ticketsLink = "https://boxoffice.postplayhouse.com/"

export function ticketsAvailable() {
	return (
		ticketsAvailableDate !== null &&
		new Date() >= new Date(ticketsAvailableDate)
	)
}
export function seasonEnded() {
	return new Date() >= new Date(dayAfterFinalPerf)
}
