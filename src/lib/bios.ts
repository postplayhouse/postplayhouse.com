import z from "zod"

export const bioGroups = [
	"board",
	"staff",
	"creative",
	"cast",
	"crew",
	"musicians",
	"additional",
] as const

export const bioGroupSchema = z.enum(bioGroups)
export type BioGroup = z.infer<typeof bioGroupSchema>

export const editableBioSchema = z.strictObject({
	firstName: z.string(),
	lastName: z.string(),
	location: z.string(),
	email: z.string(),
	bio: z.string(),
	programBio: z.string().optional(),
	staffPositions: z.array(z.string()).optional(),
	productionPositions: z.record(z.string(), z.array(z.string())).optional(),
	roles: z.record(z.string(), z.array(z.string())).optional(),
})

export type EditableBio = z.infer<typeof editableBioSchema>

const groupsPatchSchema = z
	.array(bioGroupSchema)
	.superRefine((groups, context) => {
		if (new Set(groups).size !== groups.length) {
			context.addIssue({
				code: "custom",
				message: "Groups must not contain duplicates",
			})
		}
	})

export const approveBioRequestSchema = z.strictObject({
	position: z.number().int().positive(),
	reviewed: editableBioSchema,
	metadata: z.strictObject({
		// Omitted preserves YAML, [] clears it, and a nonempty array replaces it.
		groups: groupsPatchSchema.optional(),
	}),
})

export type ApproveBioRequest = z.infer<typeof approveBioRequestSchema>
