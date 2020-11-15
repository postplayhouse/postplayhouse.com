type Year = 2015 | 2016 | 2017 | 2018 | 2019 | 2020
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

type Production = {
  title: string
  short_title?: string
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
  sponsor?: { image?: string }
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
  phone?: string
  about?: string
}

type Person = {
  last_name: string
  first_name: string
  location: string
  groups: string[]
  positions?: string[]
  staff_positions: string[]
  /** Ex: `{"Damn Yankees": ["Director", "Choreographer"]}` */
  production_positions: IHash<string[]>
  bio_approved?: boolean
  bio: string
  image_year: number
  /** defaults to firstname-lastname.jpg if not present */
  image_file?: string
}

type YearlyData = {
  businesses: Business[]
  bio_check_emails: { submit_subject: string; submit_body: string }
  productions: Record<Year, Production[]>
  people: Record<Year, Person[]>
}
