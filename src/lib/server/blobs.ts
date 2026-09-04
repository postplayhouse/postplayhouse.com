import { getDeployStore, getStore } from "@netlify/blobs"
import { isProduction, isTest } from "$lib/server/env"
import z from "zod"
import {
	bioGroupSchema,
	editableBioSchema,
	type BioGroup,
	type EditableBio,
} from "$lib/bios"

const PENDING_BIOS_STORE = "pending-bios"

export const pendingBioSchema = z.strictObject({
	position: z.number(),
	...editableBioSchema.shape,
	originalImageUrl: z.string(),
	imageYear: z.number(),
	submittedAt: z.string(),
})

export const approvedBioSchema = z.strictObject({
	...pendingBioSchema.shape,
	optimizedImageUrl: z.string().optional(),
	approvedAt: z.string().optional(),
	approvedBy: z.string().optional(),
	groups: z.array(bioGroupSchema).optional(),
})

export type PendingBio = z.infer<typeof pendingBioSchema>
export type ApprovedBio = z.infer<typeof approvedBioSchema>

const pendingBioReadSchema = z
	.object({
		...pendingBioSchema.shape,
		optimizedImageUrl: z.string().optional(),
		approvedAt: z.string().optional(),
		approvedBy: z.string().optional(),
	})
	.transform(
		({
			optimizedImageUrl: _optimizedImageUrl,
			approvedAt: _approvedAt,
			approvedBy: _approvedBy,
			...pendingBio
		}) => pendingBio,
	)

function getBiosStore() {
	return isProduction() && !isTest()
		? getStore(PENDING_BIOS_STORE)
		: getDeployStore(PENDING_BIOS_STORE)
}

function pendingKey(season: number, position: number): string {
	return `${season}/pending/${position}`
}

function approvedKey(season: number, position: number): string {
	return `${season}/approved/${position}`
}

export async function savePendingBio(
	season: number,
	bio: PendingBio,
): Promise<void> {
	const store = getBiosStore()
	const validatedBio = pendingBioSchema.parse(bio)
	const key = pendingKey(season, validatedBio.position)
	await store.setJSON(key, validatedBio)
}

export async function getPendingBio(
	season: number,
	position: number,
): Promise<PendingBio | null> {
	const store = getBiosStore()
	const key = pendingKey(season, position)
	const data = await store.get(key, { type: "json" })
	if (!data) return null
	return pendingBioReadSchema.parse(data)
}

export async function deletePendingBio(
	season: number,
	position: number,
): Promise<void> {
	const store = getBiosStore()
	const key = pendingKey(season, position)
	await store.delete(key)
}

export async function listPendingBios(season: number): Promise<PendingBio[]> {
	const store = getBiosStore()
	const prefix = `${season}/pending/`
	const { blobs } = await store.list({ prefix })

	const bios: PendingBio[] = []
	for (const blob of blobs) {
		const data = await store.get(blob.key, { type: "json" })
		if (data) {
			bios.push(pendingBioReadSchema.parse(data))
		}
	}
	return bios
}

export async function approveBio(
	season: number,
	position: number,
	approvedBy: string,
	optimizedImageUrl: string,
	reviewed: EditableBio,
	groups: BioGroup[],
): Promise<ApprovedBio | null> {
	const store = getBiosStore()
	const pendingBio = await getPendingBio(season, position)
	if (!pendingBio) return null

	const approvedBio: ApprovedBio = {
		...pendingBio,
		...editableBioSchema.parse(reviewed),
		approvedAt: new Date().toISOString(),
		approvedBy,
		optimizedImageUrl,
		groups,
	}

	const newKey = approvedKey(season, position)
	await store.setJSON(newKey, approvedBioSchema.parse(approvedBio))
	await deletePendingBio(season, position)

	return approvedBio
}

export async function getApprovedBio(
	season: number,
	position: number,
): Promise<ApprovedBio | null> {
	const store = getBiosStore()
	const key = approvedKey(season, position)
	const data = await store.get(key, { type: "json" })
	if (!data) return null
	return approvedBioSchema.parse(data)
}

export async function listApprovedBios(season: number): Promise<ApprovedBio[]> {
	const store = getBiosStore()
	const prefix = `${season}/approved/`
	const { blobs } = await store.list({ prefix })

	const bios: ApprovedBio[] = []
	for (const blob of blobs) {
		const data = await store.get(blob.key, { type: "json" })
		if (data) {
			bios.push(approvedBioSchema.parse(data))
		}
	}
	return bios
}
