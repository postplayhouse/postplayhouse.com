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
	bytes: z.number().int().nonnegative(),
	sha256,
	profile: z.string().min(1),
	transformKey: sha256,
	picture: pictureSchema,
})

export const assetSchema = z.object({
	publicPath: z.string().regex(/^\/_app\/immutable\/assets\//),
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
})

export const manifestSchema = z.object({
	schemaVersion: z.literal(1),
	publicationId: sha256,
	currentSeason: z.number().int(),
	createdAt: z.string().datetime(),
	compatibility: compatibilitySchema,
	sources: z.array(sourceSchema),
	assets: z.array(assetSchema),
})

export const lockSchema = z.object({
	schemaVersion: z.literal(1),
	manifestObject: z.string().min(1),
	manifestSha256: sha256,
	manifestBytes: z.number().int().positive(),
	publicationId: sha256,
	sourceSetSha256: sha256,
})

export const latestSchema = lockSchema.extend({
	publishedAt: z.string().datetime(),
})

export type HistoricalManifest = z.infer<typeof manifestSchema>
export type HistoricalLock = z.infer<typeof lockSchema>
export type HistoricalAsset = z.infer<typeof assetSchema>
export type HistoricalSource = z.infer<typeof sourceSchema>
