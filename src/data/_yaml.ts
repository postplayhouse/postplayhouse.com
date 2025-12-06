import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import z from "zod"

const dir = "src/data"

const YML_FILE = /\.yml$/

const bioCheckEmailsSchema = z.strictObject({
	submit_subject: z.string(),
	submit_body: z.string(),
})

const businessesSchema = z.array(
	z.strictObject({
		name: z.string(),
		site: z.string().optional(),
		type: z.array(z.string()),
		supporter: z.boolean().optional(),
		address: z
			.strictObject({
				street: z.string().nullable(),
				city: z.string(),
				state: z.string(),
				zip: z.number().nullable(),
			})
			.optional(),
		prettyURL: z.string().optional(),
		phone: z.string().nullish(),
		about: z.string().optional(),
	}),
)

export type ActualBusiness = z.infer<typeof businessesSchema>[number]

const yearsAsString = z.enum([
	"2015",
	"2016",
	"2017",
	"2018",
	"2019",
	"2020",
	"2021",
	"2022",
	"2023",
	"2024",
	"2025",
	"2026",
])

const yearsAsNumbers = z.literal([
	2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
])

export type YearAsString = z.infer<typeof yearsAsString>
export type YearAsNumber = z.infer<typeof yearsAsNumbers>

const personSchema = z.strictObject({
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

const peopleSchema = z.record(yearsAsString, z.array(personSchema))

export type ActualPeopleByYear = z.infer<typeof peopleSchema>

const baseEventSchema = z.strictObject({
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

const baseProductionSchema = z.strictObject({
	...baseEventSchema.shape,
	pre_title: z.string().optional(),
	color: z.enum(["red", "purple", "yellow", "blue", "green"]).optional(),
	roles_sorting: z.array(z.string()).nullish(),
	belongs_to_series: z.undefined(),
	special_event: z.undefined(),
})

export type ActualBaseProduction = z.infer<typeof baseProductionSchema>

const productionSchema = z.strictObject({
	...baseProductionSchema.shape,
	image: z.string(),
})

export type ActualProduction = z.infer<typeof productionSchema>

const seriesSchema = z.strictObject({
	...baseEventSchema.shape,
	special_event: z.literal(true),
	is_series: z.literal(true),
	belongs_to_series: z.undefined(),
	color: z.literal("x"),
	roles_sorting: z.undefined().nullish(),
})

export type ActualSeries = z.infer<typeof seriesSchema>

const seriesEventSchema = z.strictObject({
	...baseEventSchema.shape,
	special_event: z.literal(true),
	is_series: z.undefined(),
	belongs_to_series: z.string(),
	color: z.literal("x"),
	roles_sorting: z.undefined().nullish(),
})

export type ActualSeriesEvent = z.infer<typeof seriesEventSchema>

const specialEventSchema = z.discriminatedUnion("is_series", [
	seriesSchema,
	seriesEventSchema,
])

export type ActualSpecialEvent = z.infer<typeof specialEventSchema>

const productionsSchema = z.record(
	yearsAsString,
	z.array(
		z.discriminatedUnion("special_event", [
			productionSchema,
			specialEventSchema,
		]),
	),
)

export type ActualProductionsByYear = z.infer<typeof productionsSchema>

const yearlyDataSchema = z.strictObject({
	bio_check_emails: bioCheckEmailsSchema,
	businesses: businessesSchema,
	people: peopleSchema,
	productions: productionsSchema,
})

export type ActualYamlData = z.infer<typeof yearlyDataSchema>

function dataFromDirectory(directoryPath: string): Record<string, unknown> {
	const fullPath = (name: string) => `${directoryPath}/${name}`
	const dirname = path.basename(directoryPath)
	const data = fs
		.readdirSync(directoryPath)
		.filter((name) => {
			// allow folders that don't begin with an underscore
			if (fs.statSync(fullPath(name)).isDirectory() && name[0] !== "_") {
				return true
			}
			// allow yaml files
			return YML_FILE.test(name)
		})
		.map((name) => {
			if (fs.statSync(fullPath(name)).isDirectory()) {
				return dataFromDirectory(fullPath(name))
			} else {
				const basename = path.basename(name, ".yml")
				return {
					[basename]: yaml.load(fs.readFileSync(fullPath(name), "utf-8"), {
						schema: yaml.JSON_SCHEMA,
					}),
				}
			}
		})

	return { [dirname]: Object.assign({}, ...data) }
}

const output = dataFromDirectory(dir)["data"]

export default yearlyDataSchema.parse(output)
