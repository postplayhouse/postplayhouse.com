import { error, json } from "@sveltejs/kit"
import * as site from "$data/site"
import data from "$data/_yaml"
import { listApprovedBios, type PendingBio } from "$lib/server/blobs"
import type { RequestHandler } from "@sveltejs/kit"

export const GET: RequestHandler = async (req) => {
	const year = req.params["year"]
	if (!year) {
		return error(400, "Year parameter is required")
	}

	const yearNum = parseInt(year, 10)
	const people = data.people[year as keyof typeof data.people]

	if (!people) {
		return error(404, `No data found for year ${year}`)
	}

	// For current season, merge approved bios from Blobs
	let mergedPeople = [...people]
	if (yearNum === site.season) {
		try {
			const approvedBios = await listApprovedBios(yearNum)
			mergedPeople = mergeBiosWithYaml(people, approvedBios)
		} catch (e) {
			// If Blobs fails, fall back to YAML data only
			console.error("Failed to fetch approved bios:", e)
		}
	}

	const response = json({ site, people: mergedPeople })

	// Add cache headers for CDN
	// For current season: allow CDN caching with tag-based purging
	// For historical years: longer cache since data rarely changes
	if (yearNum === site.season) {
		response.headers.set("Cache-Control", "public, max-age=0")
		response.headers.set(
			"Netlify-CDN-Cache-Control",
			"public, max-age=86400, stale-while-revalidate=3600",
		)
		response.headers.set("Cache-Tag", `people-${year},bios`)
	} else {
		// Historical years - cache for a week
		response.headers.set("Cache-Control", "public, max-age=604800")
		response.headers.set("Netlify-CDN-Cache-Control", "public, max-age=604800")
		response.headers.set("Cache-Tag", `people-${year}`)
	}

	return response
}

/**
 * Merge approved bios from Netlify Blobs with YAML data.
 * Approved bios override YAML data for matching positions.
 */
function mergeBiosWithYaml(
	yamlPeople: YamlPerson[],
	approvedBios: PendingBio[],
): YamlPerson[] {
	// Create a map of approved bios by position for quick lookup
	const approvedByPosition = new Map<number, PendingBio>()
	for (const bio of approvedBios) {
		approvedByPosition.set(bio.position, bio)
	}

	return yamlPeople.map((person, index) => {
		// Position in the system is 1-indexed (index + 1)
		const position = index + 1
		const approvedBio = approvedByPosition.get(position)

		if (!approvedBio) {
			return person
		}

		// Merge the approved bio data into the YAML person
		return {
			...person,
			first_name: approvedBio.firstName,
			last_name: approvedBio.lastName,
			location: approvedBio.location,
			bio: approvedBio.bio,
			program_bio: approvedBio.programBio,
			staff_positions: approvedBio.staffPositions,
			production_positions: approvedBio.productionPositions,
			roles: approvedBio.roles,
			image_year: approvedBio.imageYear as Date.Year,
			image_file: approvedBio.optimizedImageUrl,
			bio_approved: true,
		}
	})
}
