const prod = process.env.NODE_ENV === "production"

// Actual values. If dev, these may change below.
const castingComplete = false
const ticketsAvailableDate = "2025-11-15T00:00:00"
const showsAnnounced = true as boolean

const boxOfficePhone = "1-888-665-1976"

// All of this "site" data should eventually be moved to a better place for
// Sapper. For now, for backward compatibility, it is all just here.
export const site = {
	baseurl: "",
	url: "__URL__", // replaced by vite.config.ts
	maintainerEmail: "don@postplayhouse.com",
	icon: "/images/post-playhouse-logo.png",
	title: "Post Playhouse",
	castingComplete: prod ? castingComplete : true,
	season: 2026 satisfies Date.Year,
	description:
		"Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse is located in historic Fort Robinson State Park.",
	boxOfficePhone,
	boxOfficePhoneLink: `tel:+${boxOfficePhone.replace(/-/g, "")}`,
	ticketsLink: "https://postplayhouse.showare.com/",
	ticketsAvailableDate,
	showsAnnounced: prod ? showsAnnounced : true,
} as const

export function ticketsAvailable() {
	return new Date() >= new Date(ticketsAvailableDate)
}

export const yearsWithPages = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]
export const yearsWithCalendars = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

if (!yearsWithCalendars.includes(site.season))
	throw new Error(
		"Don't forget to add new seasons here so they appear after the next season rolls over",
	)

export default site
