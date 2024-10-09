import { error } from "@sveltejs/kit"

export async function load(obj) {
	const res = await obj.fetch(`/data/businesses.json`)
	const data = await res.json()

	if (res.status === 200) {
		return { businesses: data.businesses as Business[] }
	} else {
		error(500, data.message)
	}
}
