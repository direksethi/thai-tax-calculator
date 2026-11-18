import { useEffect, useRef, useState } from "react"
import type { PropertyInput, SeveranceInput } from "@/tax/personal"
import type { AllowanceInputs, IncomeCategory, IncomeItem, Profile } from "@/tax/types"
import { CURRENT_YEAR } from "@/tax/years"

export type PersonalState = {
  profile: Profile
  incomes: IncomeItem[]
  allowances: AllowanceInputs
  pnd94Paid: number
  foreignTaxCredit: number
  severance: SeveranceInput
  property: PropertyInput
  /** Set once the return is saved to the account; changes then save automatically. */
  savedId?: string
  name?: string
}

export const DEFAULT_SUBTYPE: Partial<Record<IncomeCategory, string>> = {
  "40_3": "copyright",
  "40_4": "dividend",
  "40_5": "building",
  "40_6": "other",
  "40_7": "contract",
  "40_8": "27",
}

let counter = 0
export function newIncome(category: IncomeCategory): IncomeItem {
  counter += 1
  return {
    id: `${category}-${Date.now().toString(36)}-${counter}`,
    category,
    amount: 0,
    withheld: 0,
    subtype: DEFAULT_SUBTYPE[category],
    expenseMethod: "standard",
    actualExpense: 0,
    dividendRate: category === "40_4" ? 0.2 : undefined,
    excluded: category === "40_4" ? true : undefined,
  }
}

export function initialState(): PersonalState {
  return {
    profile: { year: CURRENT_YEAR, status: "single", senior: false, disabled: false },
    incomes: [{ ...newIncome("40_1"), id: "salary-0" }],
    allowances: {},
    pnd94Paid: 0,
    foreignTaxCredit: 0,
    severance: { statutory: 0, other: 0, wages400Days: 0, years: 0, withheld: 0, separate: true },
    property: { price: 0, years: 1, acquired: "inherited", useActual: false, actualCost: 0, withheld: 0, mode: "final" },
  }
}

const KEY = "thai-tax-calculator.personal.v1"

/**
 * Calculator state, kept in this browser so a refresh does not lose the
 * figures. Nothing leaves the device; storage failures fall back to memory.
 */
export function usePersonalState() {
  const [state, setState] = useState<PersonalState>(initialState)
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersonalState>
        const base = initialState()
        setState({
          ...base,
          ...parsed,
          profile: { ...base.profile, ...parsed.profile },
          severance: { ...base.severance, ...parsed.severance },
          property: { ...base.property, ...parsed.property },
        })
      }
    } catch {
      // Private windows and blocked storage simply start fresh.
    }
    loaded.current = true
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage is a convenience; the calculator works without it.
    }
  }, [state])

  return [state, setState] as const
}
