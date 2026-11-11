import { expect, test } from "vitest"
import { anniversaryRays, type RayTreatment } from "./anniversary-rays"

test.each<[RayTreatment, number, number, number]>([
	["wide", 280, 10, 8],
	["halo", 240, 8.5, 6.8],
	["fine", 320, 5.5, 4.4],
])(
	"%s rays keep equal reach with narrower bases",
	(treatment, radius, originalWidth, narrowWidth) => {
		for (const [scale, expectedWidth] of [
			[1, originalWidth],
			[0.8, narrowWidth],
		]) {
			for (const path of anniversaryRays(treatment, scale)) {
				// Inspect the generated outline, independently of its layout parameters.
				const [base, tip, end] = path
					.slice(1, -2)
					.split(" L")
					.map((point) => point.split(",").map(Number))
				expect(Math.hypot(tip[0] - 72, tip[1] - 72)).toBeCloseTo(radius, 2)
				expect(Math.hypot(end[0] - base[0], end[1] - base[1])).toBeCloseTo(
					expectedWidth,
					2,
				)
			}
		}
	},
)
