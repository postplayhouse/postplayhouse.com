import { prerender } from "$app/server"
import yamlData from "./_yaml"

export const getBusinesses = prerender(() => {
	return {
		businesses: yamlData.businesses,
	}
})
