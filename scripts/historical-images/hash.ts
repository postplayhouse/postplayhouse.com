import { createHash } from "node:crypto"
import { createReadStream } from "node:fs"

export function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
	if (value && typeof value === "object") {
		return `{${Object.entries(value)
			.filter(([, item]) => item !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
			.join(",")}}`
	}
	return JSON.stringify(value)
}

export function sha256(data: string | Buffer): string {
	return createHash("sha256").update(data).digest("hex")
}

export async function hashFile(path: string): Promise<string> {
	const hash = createHash("sha256")
	for await (const chunk of createReadStream(path)) hash.update(chunk)
	return hash.digest("hex")
}
