import { redirect } from "@sveltejs/kit"
import site from "$data/site"

export async function load() {
	redirect(302, `/calendar/${site.season}`)
}
