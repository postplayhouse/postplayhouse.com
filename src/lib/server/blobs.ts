import { getStore } from "@netlify/blobs"
import z from "zod"

const PENDING_BIOS_STORE = "pending-bios"

export const pendingBioSchema = z.object({
	position: z.number(),
	firstName: z.string(),
	lastName: z.string(),
	location: z.string(),
	email: z.string(),
	bio: z.string(),
	programBio: z.string().optional(),
	staffPositions: z.array(z.string()).optional(),
	productionPositions: z.record(z.string(), z.array(z.string())).optional(),
	roles: z.record(z.string(), z.array(z.string())).optional(),
	originalImageUrl: z.string(),
	optimizedImageUrl: z.string().optional(),
	imageYear: z.number(),
	submittedAt: z.string(),
	approvedAt: z.string().optional(),
	approvedBy: z.string().optional(),
})

export type PendingBio = z.infer<typeof pendingBioSchema>

function getBiosStore() {
	return getStore(PENDING_BIOS_STORE)
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
	const key = pendingKey(season, bio.position)
	await store.setJSON(key, bio)
}

export async function getPendingBio(
	season: number,
	position: number,
): Promise<PendingBio | null> {
	const store = getBiosStore()
	const key = pendingKey(season, position)
	const data = await store.get(key, { type: "json" })
	if (!data) return null
	return pendingBioSchema.parse(data)
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
			bios.push(pendingBioSchema.parse(data))
		}
	}
	return bios
}

export async function approveBio(
	season: number,
	position: number,
	approvedBy: string,
	optimizedImageUrl: string,
): Promise<PendingBio | null> {
	const store = getBiosStore()
	const pendingBio = await getPendingBio(season, position)
	if (!pendingBio) return null

	const approvedBio: PendingBio = {
		...pendingBio,
		approvedAt: new Date().toISOString(),
		approvedBy,
		optimizedImageUrl,
	}

	const newKey = approvedKey(season, position)
	await store.setJSON(newKey, approvedBio)
	await deletePendingBio(season, position)

	return approvedBio
}

export async function getApprovedBio(
	season: number,
	position: number,
): Promise<PendingBio | null> {
	const store = getBiosStore()
	const key = approvedKey(season, position)
	const data = await store.get(key, { type: "json" })
	if (!data) return null
	return pendingBioSchema.parse(data)
}

export async function listApprovedBios(season: number): Promise<PendingBio[]> {
	const store = getBiosStore()
	const prefix = `${season}/approved/`
	const { blobs } = await store.list({ prefix })

	const bios: PendingBio[] = []
	for (const blob of blobs) {
		const data = await store.get(blob.key, { type: "json" })
		if (data) {
			bios.push(pendingBioSchema.parse(data))
		}
	}
	return bios
}
