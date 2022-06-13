/* eslint-disable @typescript-eslint/no-unused-vars */

namespace Date {
  type Year = 2015 | 2016 | 2017 | 2018 | 2019 | 2020 | 2021 | 2022
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

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false

type IsYear<X> = Equal<ToNumber<X>, Date.Year> extends true ? X : never
type X = ToNumber<"45">
type Y = IsYear<"2022">

type Production = {
  title: string
  short_title?: string
  pre_title?: string
  rating?: string
  rating_explanation?: string
  color: string
  image: string
  /** ex: "2020-05-29" */
  opening: string
  writers: string
  description: string
  dates?: { fort_rob?: string; lead?: string }
  roles_sorting?: string[]
  sponsor?: { image?: string; link?: string; text?: string }
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
  productions: Record<Year, Production[]>
  people: Record<Year, YamlPerson[]>
}
