import { z } from "zod"

const sha256 = z.string().regex(/^[a-f0-9]{64}$/)
const safeRelativePath = z
	.string()
	.min(1)
	.refine(
		(value) =>
			!value.startsWith("/") &&
			!value.includes("\\") &&
			!value.split("/").includes(".."),
		"path must be a safe repository-relative POSIX path",
	)

export const pictureSchema = z.object({
	sources: z.record(z.string(), z.string()),
	img: z.object({
		src: z.string(),
		w: z.number().int().positive(),
		h: z.number().int().positive(),
	}),
})

export const sourceSchema = z.object({
	path: safeRelativePath,
	logicalPath: safeRelativePath.optional(),
	sourceId: z.string().min(1).optional(),
	collection: z.string().min(1).optional(),
	bytes: z.number().int().nonnegative(),
	sha256,
	profile: z.string().min(1),
	transformKey: sha256,
	picture: pictureSchema,
})

export const assetSchema = z.object({
	publicPath: z.string().startsWith("/"),
	bytes: z.number().int().positive(),
	sha256,
	format: z.enum(["avif", "webp", "jpeg", "jpg", "png"]),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	aliasOf: z.string().optional(),
})

export const compatibilitySchema = z.object({
	generatorRevision: z.number().int().positive(),
	lockfileSha256: sha256,
	packages: z.record(z.string(), z.string()),
	libvips: z.string(),
	nodeMajor: z.number().int().positive(),
	platform: z.string(),
	arch: z.string(),
	profileConfigurationSha256: sha256,
	generatorSourceSha256: sha256.optional(),
	nodeVersion: z.string().optional(),
	sharpVersionsSha256: sha256.optional(),
})

export const manifestSchema = z
	.object({
		schemaVersion: z.literal(1),
		publicationId: sha256,
		configurationId: z.string().min(1).optional(),
		// Compatibility with the already-qualified prototype publication.
		currentSeason: z.number().int().optional(),
		createdAt: z.string().datetime(),
		compatibility: compatibilitySchema,
		sources: z.array(sourceSchema),
		assets: z.array(assetSchema),
	})
	.refine(
		(manifest) => manifest.configurationId || manifest.currentSeason,
		"manifest requires configurationId",
	)

const generatedOutputSchema = z.object({
	bytes: z.number().int().positive(),
	sha256,
})

export const lockSchema = z.object({
	schemaVersion: z.union([z.literal(1), z.literal(2)]),
	manifestObject: z.string().min(1),
	manifestSha256: sha256,
	manifestBytes: z.number().int().positive(),
	publicationId: sha256,
	sourceSetSha256: sha256,
	pipelineSha256: sha256.optional(),
	generatedOutputs: z
		.record(safeRelativePath, generatedOutputSchema)
		.optional(),
	summary: z
		.object({
			sourceProfiles: z.number().int().nonnegative(),
			uniqueSources: z.number().int().nonnegative(),
			publicPaths: z.number().int().nonnegative(),
			uniqueObjects: z.number().int().nonnegative(),
			uniqueBytes: z.number().int().nonnegative(),
			addedPublicPaths: z.array(z.string()),
			removedPublicPaths: z.array(z.string()),
			addedSourceProfiles: z.array(z.string()),
			removedSourceProfiles: z.array(z.string()),
			changedSourceProfiles: z.array(z.string()),
		})
		.optional(),
})

export const latestSchema = lockSchema.extend({
	publishedAt: z.string().datetime(),
})

export type HistoricalManifest = z.infer<typeof manifestSchema>
export type HistoricalLock = z.infer<typeof lockSchema>
export type HistoricalAsset = z.infer<typeof assetSchema>
export type HistoricalSource = z.infer<typeof sourceSchema>
