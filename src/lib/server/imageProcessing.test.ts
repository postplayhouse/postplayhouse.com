import { describe, test, expect } from "vitest"
import sharp from "sharp"
import {
	toKebabCase,
	getOptimizedImagePath,
	processHeadshotImage,
} from "./imageProcessing"

describe("toKebabCase", () => {
	test("converts simple name", () => {
		expect(toKebabCase("John Doe")).toBe("john-doe")
	})

	test("handles multiple spaces", () => {
		expect(toKebabCase("Mary Jane Watson")).toBe("mary-jane-watson")
	})

	test("handles special characters", () => {
		expect(toKebabCase("O'Brien")).toBe("o-brien")
	})

	test("trims whitespace", () => {
		expect(toKebabCase("  extra spaces  ")).toBe("extra-spaces")
	})

	test("handles numbers in names", () => {
		expect(toKebabCase("Actor 123")).toBe("actor-123")
	})

	test("handles multiple special characters", () => {
		expect(toKebabCase("Mary-Jane O'Connor")).toBe("mary-jane-o-connor")
	})
})

describe("getOptimizedImagePath", () => {
	test("generates correct path for simple name", () => {
		expect(getOptimizedImagePath(2026, "John", "Doe")).toBe(
			"optimized/2026/john-doe.jpg",
		)
	})

	test("generates correct path for compound name", () => {
		expect(getOptimizedImagePath(2025, "Mary Jane", "Watson")).toBe(
			"optimized/2025/mary-jane-watson.jpg",
		)
	})

	test("handles names with apostrophes", () => {
		expect(getOptimizedImagePath(2026, "Brian", "O'Brien")).toBe(
			"optimized/2026/brian-o-brien.jpg",
		)
	})
})

describe("processHeadshotImage", () => {
	async function createTestImage(
		width: number,
		height: number,
	): Promise<Buffer> {
		return sharp({
			create: {
				width,
				height,
				channels: 3,
				background: { r: 255, g: 0, b: 0 },
			},
		})
			.jpeg()
			.toBuffer()
	}

	test("returns a JPEG buffer", async () => {
		const input = await createTestImage(100, 100)
		const output = await processHeadshotImage(input)

		// Check JPEG magic bytes
		expect(output[0]).toBe(0xff)
		expect(output[1]).toBe(0xd8)
	})

	test("does not enlarge small images", async () => {
		const input = await createTestImage(400, 300)
		const output = await processHeadshotImage(input)

		const metadata = await sharp(output).metadata()
		expect(metadata.width).toBe(400)
		expect(metadata.height).toBe(300)
	})

	test("resizes large images to fit within 800x800", async () => {
		const input = await createTestImage(1600, 1200)
		const output = await processHeadshotImage(input)

		const metadata = await sharp(output).metadata()
		// Should fit inside 800x800 maintaining aspect ratio
		// 1600x1200 with aspect 4:3 should become 800x600
		expect(metadata.width).toBe(800)
		expect(metadata.height).toBe(600)
	})

	test("handles tall portrait images correctly", async () => {
		const input = await createTestImage(600, 1200)
		const output = await processHeadshotImage(input)

		const metadata = await sharp(output).metadata()
		// 600x1200 with aspect 1:2 should become 400x800
		expect(metadata.width).toBe(400)
		expect(metadata.height).toBe(800)
	})

	test("produces smaller file size for large images", async () => {
		const input = await createTestImage(1600, 1200)
		const output = await processHeadshotImage(input)

		// Processed image should be smaller (resized + quality 80)
		expect(output.length).toBeLessThan(input.length)
	})
})
