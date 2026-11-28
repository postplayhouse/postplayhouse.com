/** Box office origins the donation form may be framed from. Never accept others. */
export const donateEmbedHosts = {
	production: "https://boxoffice.postplayhouse.com",
	staging: "https://boxoffice-staging.postplayhouse.com",
} as const

export type DonateEmbedHost = keyof typeof donateEmbedHosts

/** `?host=staging` selects staging; anything else falls back to production. */
export function parseDonateEmbedHost(value: string | null): DonateEmbedHost {
	return value === "staging" ? "staging" : "production"
}

export function donateEmbedUrl(host: DonateEmbedHost) {
	return `${donateEmbedHosts[host]}/donate/embed`
}

/** The full-page form, with the box office header and nav. */
export function donatePageUrl(host: DonateEmbedHost) {
	return `${donateEmbedHosts[host]}/donate`
}

export const heightMessageType = "postplayhouse:donate-embed:height"
export const doneMessageType = "postplayhouse:donate-embed:done"
