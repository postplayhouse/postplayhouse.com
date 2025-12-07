import z from "zod"
import { allYears } from "./site"

type NumberArrayToStringArray<T extends readonly number[]> = {
	[K in keyof T]: `${T[K]}`
}

const yearsStrings = allYears.map(
	String,
) as unknown as NumberArrayToStringArray<typeof allYears>

export const yearsAsNumbers = z.literal(allYears)
export const yearsAsString = z.enum([...yearsStrings])

export type YearAsString = z.infer<typeof yearsAsString>
export type YearAsNumber = z.infer<typeof yearsAsNumbers>

export const personSchema = z.strictObject({
	last_name: z.string().nullish(),
	first_name: z.string(),
	location: z.string().nullish(),
	groups: z
		.array(
			z.enum([
				"board",
				"staff",
				"creative",
				"cast",
				"crew",
				"musicians",
				"additional",
			]),
		)
		.optional(),
	positions: z.array(z.string()).nullish(),
	staff_positions: z.array(z.string()).optional(),
	production_positions: z.record(z.string(), z.array(z.string())).optional(),
	roles: z.record(z.string(), z.array(z.string())).optional(),
	image_year: yearsAsNumbers.nullish(),
	image_file: z.string().optional(),
	bio: z.string().optional(),
	program_bio: z.string().optional(),
	lobby_display: z.boolean().optional(),
	bio_approved: z.boolean().optional(),
	sort_group: z.number().optional(),
})

export type ActualPerson = z.infer<typeof personSchema>

export const peopleSchema = z.record(yearsAsString, z.array(personSchema))

export type ActualPeopleByYear = z.infer<typeof peopleSchema>

export const baseEventSchema = z.strictObject({
	// Discriminators
	special_event: z.boolean().optional(),
	belongs_to_series: z.string().optional(),
	is_series: z.boolean().optional(),

	// Common fields
	title: z.string(),
	short_title: z.string().nullish(),
	description: z.string(),
	dates: z.partialRecord(z.enum(["fort_rob", "lead"]), z.string()).optional(),
	image: z.string().optional(),
	sponsor: z
		.strictObject({
			text: z.string().optional(),
			link: z.string().optional(),
			image: z.string().optional(),
		})
		.nullish(),

	// Must be present for ease of use only (could also just be in Production Base, but would require more runtime changes)
	pre_title: z.string().optional(),
	opening: z.iso.date().optional(),
	writers: z.string().nullish(),
	rating: z.enum(["G", "H", "PG"]).optional(),
	rating_explanation: z.string().optional(),
})

export type ActualBaseEvent = z.infer<typeof baseEventSchema>

export const baseProductionSchema = z.strictObject({
	...baseEventSchema.shape,
	pre_title: z.string().optional(),
	color: z.enum(["red", "purple", "yellow", "blue", "green"]).optional(),
	roles_sorting: z.array(z.string()).nullish(),
	belongs_to_series: z.undefined(),
	special_event: z.undefined(),
})

export type ActualBaseProduction = z.infer<typeof baseProductionSchema>

export const productionSchema = z.strictObject({
	...baseProductionSchema.shape,
	image: z.string(),
})

export type ActualProduction = z.infer<typeof productionSchema>

export const seriesSchema = z.strictObject({
	...baseEventSchema.shape,
	special_event: z.literal(true),
	is_series: z.literal(true),
	belongs_to_series: z.undefined(),
	color: z.literal("x"),
	roles_sorting: z.undefined().nullish(),
})

export type ActualSeries = z.infer<typeof seriesSchema>

export const seriesEventSchema = z.strictObject({
	...baseEventSchema.shape,
	special_event: z.literal(true),
	is_series: z.undefined(),
	belongs_to_series: z.string(),
	color: z.literal("x"),
	roles_sorting: z.undefined().nullish(),
})

export type ActualSeriesEvent = z.infer<typeof seriesEventSchema>

export const specialEventSchema = z.discriminatedUnion("is_series", [
	seriesSchema,
	seriesEventSchema,
])

export type ActualSpecialEvent = z.infer<typeof specialEventSchema>

export const productionsSchema = z.record(
	yearsAsString,
	z.array(
		z.discriminatedUnion("special_event", [
			productionSchema,
			specialEventSchema,
		]),
	),
)

export type ActualProductionsByYear = z.infer<typeof productionsSchema>

export const yearlyDataSchema = z.strictObject({
	people: peopleSchema,
	productions: productionsSchema,
})

export type ActualYamlData = z.infer<typeof yearlyDataSchema>
