import { mkdir, readFile, stat, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export interface ArtifactStore {
	get(name: string): Promise<Buffer | null>
	putImmutable(
		name: string,
		body: Buffer,
		contentType: string,
	): Promise<"created" | "exists">
	putPointer(name: string, body: Buffer): Promise<void>
}

export class FileArtifactStore implements ArtifactStore {
	constructor(private readonly root: string) {}

	private path(name: string): string {
		if (name.startsWith("/") || name.split("/").includes(".."))
			throw new Error(`Unsafe artifact name: ${name}`)
		return join(this.root, name)
	}

	async get(name: string): Promise<Buffer | null> {
		try {
			return await readFile(this.path(name))
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
			throw error
		}
	}

	async putImmutable(
		name: string,
		body: Buffer,
	): Promise<"created" | "exists"> {
		const target = this.path(name)
		try {
			const existing = await readFile(target)
			if (!existing.equals(body))
				throw new Error(`Immutable artifact collision at ${name}`)
			return "exists"
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
		}
		await mkdir(dirname(target), { recursive: true })
		await writeFile(target, body, { flag: "wx" })
		return "created"
	}

	async putPointer(name: string, body: Buffer): Promise<void> {
		const target = this.path(name)
		await mkdir(dirname(target), { recursive: true })
		const temporary = `${target}.${process.pid}.tmp`
		await writeFile(temporary, body)
		await import("node:fs/promises").then(({ rename }) =>
			rename(temporary, target),
		)
	}

	async bytes(name: string): Promise<number | null> {
		try {
			return (await stat(this.path(name))).size
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
			throw error
		}
	}
}
