import { redirect } from '@sveltejs/kit';
import type { PageLoad } from "@sveltejs/kit"
import site from "../../data/site"

export const load: PageLoad = async () => {
  throw redirect(302, `/calendar/${site.season}`);
}
