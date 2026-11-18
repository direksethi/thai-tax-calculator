import type { TaxYear } from "@/tax/types"
import { YEARS } from "@/tax/years"
import { initialState, type PersonalState } from "./state"

/** One-off or expired items that should not carry into the next year. */
const ONE_OFF = ["eerGeneral", "eerOtop", "travelMainPaper", "travelMainEtax", "travelSecPaper", "travelSecEtax", "thaiEsgxNew", "prenatal", "solar", "floodHome", "floodVehicle", "homeConstruction", "art", "energy", "cctv"]

/**
 * Next year's starting point: the same income scaled by an expected change,
 * the same recurring allowances, and nothing that was a one-off or that the
 * new year's rules no longer allow. Social security follows the new ceiling.
 */
export function rollForward(state: PersonalState, to: TaxYear, growth: number): PersonalState {
  const from = YEARS[state.profile.year]
  const next = YEARS[to]
  const scale = (n: number) => Math.round(n * (1 + growth))
  const allowances = { ...state.allowances }
  for (const key of ONE_OFF) delete allowances[key]
  if ((allowances.socialSecurity ?? 0) >= from.socialSecurityMax) allowances.socialSecurity = next.socialSecurityMax
  if (allowances.thaiEsgxLtf) allowances.thaiEsgxLtf = Math.min(allowances.thaiEsgxLtf, next.thaiEsgxLtfMax)
  for (const key of ["pvd", "gpf", "teacherFund"]) if (allowances[key]) allowances[key] = scale(allowances[key])
  const fresh = initialState()
  return {
    ...state,
    profile: { ...state.profile, year: to },
    incomes: state.incomes.map((i) => ({ ...i, amount: scale(i.amount), withheld: scale(i.withheld), actualExpense: i.actualExpense ? scale(i.actualExpense) : i.actualExpense })),
    allowances,
    pnd94Paid: 0,
    foreignTaxCredit: 0,
    severance: fresh.severance,
    property: fresh.property,
    savedId: undefined,
    name: undefined,
  }
}
