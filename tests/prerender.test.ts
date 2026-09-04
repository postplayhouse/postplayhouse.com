import { expect, test } from "@playwright/test"
import { access } from "node:fs/promises"

async function wasPrerendered(path: string): Promise<boolean> {
	try {
		await access(`build/${path}/index.html`)
		return true
	} catch {
		return false
	}
}

test("only historical biography pages are emitted as prerendered HTML", async () => {
	await expect(wasPrerendered("who/2026")).resolves.toBe(true)
	await expect(wasPrerendered("who/2027")).resolves.toBe(false)
	await expect(wasPrerendered("program-bios")).resolves.toBe(false)
})
