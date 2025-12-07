import type {
	ActualBusiness,
	ActualPeopleByYear,
	ActualPerson,
	ActualProduction,
	ActualProductionsByYear,
	ActualSeries,
	ActualSeriesEvent,
	ActualSpecialEvent,
	ActualYamlData,
	YearAsNumber,
	ActualBaseEvent,
	ActualBaseProduction,
	YearAsString,
} from "./validation"

declare global {
	namespace Date {
		type Year = YearAsNumber
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

	type __BaseEvent = ActualBaseEvent

	type __BaseProduction = ActualBaseProduction

	type Production = ActualProduction

	type SpecialEvent = ActualSpecialEvent

	type Series = ActualSeries & {
		events: SpecialEvent[]
	}

	type Business = ActualBusiness

	type YamlPerson = ActualPerson

	type YearlyData = ActualYamlData
}
