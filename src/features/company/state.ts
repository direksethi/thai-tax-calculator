import { useEffect, useRef, useState } from "react"
import type { CompanyInput } from "@/tax/company"
import { CURRENT_YEAR } from "@/tax/years"

export type CompanyState = CompanyInput & { partners: number; savedId?: string; name?: string }

export function initialCompany(): CompanyState {
  return {
    year: CURRENT_YEAR,
    personal: { category: "40_2" },
    revenue: 2_400_000,
    businessCosts: 120_000,
    sharedCosts: 60_000,
    otherAllowances: 0,
    entity: "company",
    sme: true,
    registeredCapital: 1_000_000,
    salaryMode: "optimize",
    monthlySalary: 50_000,
    ownerInSso: false,
    pvdRate: 0,
    homeOfficeRent: 0,
    carRent: 0,
    assets: [],
    doubleDeduction: 0,
    entertainment: 0,
    accountingMode: "itemized",
    accountingPackage: 25_000,
    bookkeepingMonthly: 2_500,
    audit: 15_000,
    misc: 5_000,
    includeFormation: false,
    distribution: 1,
    partners: 2,
  }
}

const KEY = "thai-tax-calculator.company.v1"

export function useCompanyState() {
  const [state, setState] = useState<CompanyState>(initialCompany)
  const loaded = useRef(false)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY)
      if (raw) setState({ ...initialCompany(), ...(JSON.parse(raw) as Partial<CompanyState>) })
    } catch {
      // Start fresh when storage is unavailable.
    }
    loaded.current = true
  }, [])
  useEffect(() => {
    if (!loaded.current) return
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage is optional.
    }
  }, [state])
  return [state, setState] as const
}
