import { prerender } from "$app/server"
import yamlData from "./_yaml"
import * as site from "./site"
import { yearsAsNumbers, yearsAsString } from "./validation"

export const getYearsWithPeople = prerender(() => {
	return Object.keys(yamlData.people).map((year) => yearsAsString.parse(year))
})

export const getPeople = prerender(yearsAsNumbers, (year) => {
	return {
		year,
		people: yamlData.people[year],
		seasonCastingComplete: site.season === year ? site.castingComplete : true,
	}
})
