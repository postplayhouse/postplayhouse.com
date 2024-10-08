import site from "$data/site.js"
import { error } from "@sveltejs/kit"

const disabled = false

// When disabled, prevent hydration
export const csr = !disabled

export async function load(obj) {
	const res = await obj.fetch(`/data/productions/${site.season}.json`)
	const data = await res.json()

	if (res.status === 200) {
		return {
			productions: data.productions as Production[],
			year: site.season,
			disabled,
			...obj.data,
		}
	} else {
		error(500, `could not fetch /data/productions/${site.season}.json`)
	}
}
