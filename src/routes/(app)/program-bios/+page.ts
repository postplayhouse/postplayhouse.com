import { error } from "@sveltejs/kit"
import site from "$data/site"
import { marked } from "marked"

marked.setOptions({ smartypants: true })

export async function load(obj) {
	const peopleRes = await obj.fetch(`/data/people/${site.season}.json`)
	const peopleData = await peopleRes.json()
	if (peopleRes.status !== 200) throw error(500, peopleData.message)

	const productionsRes = await obj.fetch(
		`/data/productions/${site.season}.json`,
	)
	const productionsData = await productionsRes.json()
	if (productionsRes.status !== 200) throw error(500, productionsData.message)

	return {
		people: peopleData.people as YamlPerson[],
		productions: productionsData.productions as Production[],
	}
}
