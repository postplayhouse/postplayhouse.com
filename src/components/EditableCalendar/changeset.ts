import {
  type PerformanceDetails,
  type ProductionDetails,
  type ShowingsData,
  sortPerformances,
} from "./showingsData"

function performanceExists(
  performances: PerformanceDetails[],
  performance: PerformanceDetails,
): boolean {
  return !!performances.find((p) => matchingPerformanceSlot(p, performance))
}

export function addPerformance(
  showingsData: ShowingsData,
  performance: PerformanceDetails,
) {
  if (performanceExists(showingsData.performances, performance))
    return showingsData

  const newArr = [...showingsData.performances, performance]
  newArr.sort(sortPerformances)

  return { ...showingsData, performances: newArr }
}

function matchingPerformanceSlot(
  a: Omit<PerformanceDetails, "id">,
  b: Omit<PerformanceDetails, "id">,
): boolean {
  for (const key of ["year", "month", "day", "slot"] as const) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export function removePerformanceBySlot(
  showingsData: ShowingsData,
  performance: Omit<PerformanceDetails, "id">,
) {
  const newPerformances = showingsData.performances.filter(
    (p) => !matchingPerformanceSlot(p, performance),
  )

  return { ...showingsData, performances: newPerformances }
}

export function removeProduction(
  schedule: ShowingsData,
  productionOrShortName: ProductionDetails | string,
): ShowingsData {
  const prod =
    typeof productionOrShortName === "string"
      ? { shortTitle: productionOrShortName }
      : productionOrShortName

  return {
    ...schedule,
    productions: schedule.productions.filter(
      (p) => p.shortTitle !== prod.shortTitle,
    ),
  }
}

type MinimumProduction = Pick<ProductionDetails, "longTitle"> &
  Partial<ProductionDetails>

function makeNewProduction(partial: MinimumProduction): ProductionDetails {
  return {
    shortTitle: partial.shortTitle || partial.longTitle,
    color: "fff",
    ...partial,
  }
}

export function addProduction(
  schedule: ShowingsData,
  production: MinimumProduction,
): ShowingsData {
  const newProduction = makeNewProduction(production)

  if (
    schedule.productions.findIndex(
      (p) => p.shortTitle === newProduction.shortTitle,
    ) !== -1
  ) {
    return schedule
  }

  const newProductions = [...schedule.productions, newProduction]

  return { ...schedule, productions: newProductions }
}

export function editProduction(
  schedule: ShowingsData,
  originalOrShortTitle: ProductionDetails | string,
  edited: Partial<ProductionDetails>,
): ShowingsData {
  const prod =
    typeof originalOrShortTitle === "string"
      ? { shortTitle: originalOrShortTitle }
      : originalOrShortTitle

  const newProductions = schedule.productions.map((p) =>
    p.shortTitle === prod.shortTitle ? { ...p, ...edited } : p,
  )

  const newPerformances = schedule.performances
  if (edited.shortTitle && edited.shortTitle !== prod.shortTitle) {
    newPerformances.map((p) =>
      p.id === prod.shortTitle ? { ...p, id: edited.shortTitle } : p,
    )
  }

  return { performances: newPerformances, productions: newProductions }
}
