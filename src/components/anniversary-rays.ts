// Trim empty PDF margins, without moving or scaling individual artwork layers.
export const anniversaryLayout = {
	x: 18,
	y: 36,
	width: 108,
	height: 88,
	originX: 72,
	originY: 72,
} as const

// Independent of ray shape: shrink both the clear center and the fade's reach
// without increasing the treatment's overall opacity.
export const rayFades = {
	original: { label: "Original", clear: 0.24, full: 0.875 },
	closer: { label: "Closer", clear: 0.16, full: 0.7 },
	tight: { label: "Tight", clear: 0.08, full: 0.52 },
	core: { label: "Near 60", clear: 0.03, full: 0.38 },
} as const

export type RayFade = keyof typeof rayFades

export const rayTreatments = {
	wide: {
		label: "Wide burst",
		description:
			"A broad, even burst sweeping behind the header, navigation and page copy.",
		radius: 280,
		count: 30,
		width: 10,
		period: 360,
		opacity: 0.5,
	},
	halo: {
		label: "Soft halo",
		description: "A smaller, softer burst with a gentler sweep and fewer rays.",
		radius: 240,
		count: 24,
		width: 8.5,
		period: 480,
		opacity: 0.35,
	},
	fine: {
		label: "Fine rays",
		description:
			"A wider reach with more, finer rays and plenty of negative space.",
		radius: 320,
		count: 40,
		width: 5.5,
		period: 420,
		opacity: 0.4,
	},
} as const

export type RayTreatment = keyof typeof rayTreatments

export function anniversaryRays(treatment: RayTreatment, widthScale = 1) {
	const { radius, count, width } = rayTreatments[treatment]
	const { originX, originY } = anniversaryLayout
	return Array.from({ length: count }, (_, index) => {
		const angle = (index * Math.PI * 2) / count
		const x = Math.cos(angle)
		const y = Math.sin(angle)
		const point = (along: number, across: number) =>
			`${(originX + x * along - y * across).toFixed(3)},${(originY + y * along + x * across).toFixed(3)}`
		return `M${point(7, (-width * widthScale) / 2)} L${point(radius, 0)} L${point(7, (width * widthScale) / 2)} Z`
	})
}
