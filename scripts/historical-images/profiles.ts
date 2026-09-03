import type { ArtifactConfig } from "./config"

export const historicalImageProfiles = {
	"people-400-800": {
		query: { enhanced: true, w: "400;800", withoutEnlargement: true },
		srcsetDescriptors: "width",
	},
	"season-500-1000-1500": {
		query: {
			enhanced: true,
			w: "500;1000;1500",
			withoutEnlargement: true,
		},
		srcsetDescriptors: "width",
	},
	"raffle-default-1x-2x": {
		query: { enhanced: true },
		srcsetDescriptors: "density",
	},
} as const satisfies ArtifactConfig["profiles"]
