/* eslint-disable @typescript-eslint/no-unused-vars */

namespace Date {
	type Year = 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022 | 2023
	type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
	type Day =
		| 1
		| 2
		| 3
		| 4
		| 5
		| 6
		| 7
		| 8
		| 9
		| 10
		| 11
		| 12
		| 13
		| 14
		| 15
		| 16
		| 17
		| 18
		| 19
		| 20
		| 21
		| 22
		| 23
		| 24
		| 25
		| 26
		| 27
		| 28
		| 29
		| 30
		| 31
}

type ToNumber<
	Len extends string,
	Arr extends unknown[] = [],
> = `${Len}` extends `${Arr["length"]}`
	? Arr["length"]
	: ToNumber<Len, [...Arr, unknown]>

type A = Lowercase<2010>

type NoValues<T> = { [K in keyof T]?: undefined }

type Equal<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
		? true
		: false

type IsYear<X> = Equal<ToNumber<X>, Date.Year> extends true ? X : never
type X = ToNumber<"45">
type Y = IsYear<"2022">

type __BaseEvent = {
	title: string
	short_title?: string
	special_event?: boolean
	description: string
	dates: { fort_rob?: string; lead?: string }
	belongs_to_series?: string
	is_series?: boolean
	image?: string
	sponsor?: { image?: string; link?: string; text?: string }
}

type __BaseProduction = {
	pre_title?: string
	rating?: string
	rating_explanation?: string
	color: string
	/** ex: "2020-05-29" */
	opening: string
	writers: string
	roles_sorting?: string[]
}

type Production = __BaseEvent &
	__BaseProduction & {
		/** Do not display at top of calendar */
		image: string
		special_event?: false
	}

type SpecialEvent = __BaseEvent & {
	special_event: true
	belongs_to_series?: string
} & NoValues<__BaseProduction>

type Series = SpecialEvent & {
	is_series: true
	events: SpecialEvent[]
}

type Business = {
	name: string
	site?: string
	type: string[]
	supporter?: boolean
	address?: {
		street?: string
		city?: string
		state?: string
		zip?: number
	}
	prettyURL?: string
	phone?: string
	about?: string
}

type YamlPerson = {
	last_name: string
	first_name: string
	/** Sort by this value first, if it appears. Then last, first. */
	sort_name?: string
	location: string
	groups: string[]
	positions?: string[]
	staff_positions: string[]
	/** Ex: `{"Damn Yankees": ["Director", "Choreographer"]}` */
	production_positions: IHash<string[]>
	bio_approved?: boolean
	bio: string
	program_bio?: string
	image_year: number
	/** defaults to firstname-lastname.jpg if not present */
	image_file?: string
	lobby_display?: boolean
}

type YearlyData = {
	businesses: Business[]
	bio_check_emails: { submit_subject: string; submit_body: string }
	productions: Record<Year, Array<Production | SpecialEvent>>
	people: Record<Year, YamlPerson[]>
}
