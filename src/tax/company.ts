import { round2 } from "./brackets"
import { computePersonal, type PersonalResult } from "./personal"
import type { IncomeItem, TaxYear } from "./types"

export const SSO_CEILING: Record<TaxYear, number> = { 2568: 15_000, 2569: 17_500, 2570: 17_500 }

/** Corporate income tax. SME bands apply when paid-up capital is at most 5M and revenue at most 30M. */
export function cit(profit: number, sme: boolean): number {
  const p = Math.max(0, profit)
  if (!sme) return round2(p * 0.2)
  return round2(0.15 * Math.min(Math.max(p - 300_000, 0), 2_700_000) + 0.2 * Math.max(p - 3_000_000, 0))
}

/**
 * Dividend tax credit when the payer cannot point to a band, averaged pro rata
 * to after-tax profit in each band (RD Order Por. 119/2545 clause 13).
 * Returns the credit per baht of dividend.
 */
export function creditFraction(profit: number, sme: boolean): number {
  const p = Math.max(0, profit)
  if (p === 0) return 0
  if (!sme) return 0.25
  const r0 = Math.min(p, 300_000)
  const r15 = Math.min(Math.max(p - 300_000, 0), 2_700_000) * 0.85
  const r20 = Math.max(p - 3_000_000, 0) * 0.8
  const total = r0 + r15 + r20
  return total > 0 ? (r15 / total) * (15 / 85) + (r20 / total) * 0.25 : 0
}

export type PersonalIncomeType = { category: IncomeItem["category"]; subtype?: string; label: string }

export type AssetKind = "computer" | "car" | "equipment" | "furniture"

export const ASSET_LIFE: Record<AssetKind, { rate: number; cap?: number }> = {
  computer: { rate: 1 / 3 },
  car: { rate: 0.2, cap: 1_000_000 },
  equipment: { rate: 0.2 },
  furniture: { rate: 0.2 },
}

export type AssetSale = { id: string; kind: AssetKind; label: string; price: number }

export type CompanyInput = {
  year: TaxYear
  /** Income type if earned personally. */
  personal: { category: IncomeItem["category"]; subtype?: string }
  revenue: number
  /** Third-party business costs paid in either structure: contractors, software, stock, ads. */
  businessCosts: number
  /** Costs a company can deduct that a person on the standard deduction pays from taxed income. */
  sharedCosts: number
  /** Allowances other than the 60,000 personal allowance (insurance, RMF, children). */
  otherAllowances: number
  entity: "company" | "partnership"
  sme: boolean
  registeredCapital: number
  salaryMode: "optimize" | "fixed"
  monthlySalary: number
  ownerInSso: boolean
  /** Employer and employee provident fund contribution, as a share of salary (max 15%). */
  pvdRate: number
  homeOfficeRent: number
  carRent: number
  assets: AssetSale[]
  /** Spending eligible for 2x: training, e-Tax systems, SME digital up to 300,000. */
  doubleDeduction: number
  entertainment: number
  /** One yearly fee to an accountant who handles everything, or bookkeeping and audit priced separately. */
  accountingMode: "package" | "itemized"
  accountingPackage: number
  bookkeepingMonthly: number
  audit: number
  misc: number
  includeFormation: boolean
  /** Share of after-tax profit paid out as dividends this year. */
  distribution: number
}

export type PersonalScenario = {
  kind: "standard" | "actual"
  tax: number
  cash: number
  result: PersonalResult
}

export type CompanyScenario = {
  salary: number
  sso: { employee: number; employer: number }
  pvd: { employee: number; employer: number }
  depreciation: number
  doubleExtra: number
  entertainmentAllowed: number
  carRentAllowed: number
  runningCosts: number
  formation: number
  profitBeforeTax: number
  cit: number
  reserve: number
  dividend: number
  retained: number
  creditFraction: number
  dividendIncluded: boolean
  ownerTax: number
  ownerResult: PersonalResult
  /** Personal income tax on salary and rent alone, the part an employer withholds through the year. */
  payTax: number
  /** PIT the company withholds from salary each year on PND 1, estimated on salary alone. */
  salaryWithholding: number
  /** Tax on the dividend: the 10% final tax, or the net effect of including it with the credit (negative is money back). */
  dividendTax: number
  assetProceeds: number
  /** Money reaching the owner this year after every tax and contribution. */
  cash: number
  /** Cash plus provident fund balances, the owner's money either way. */
  wealth: number
  totalTax: number
}

export type CompanyComparison = {
  standard: PersonalScenario
  actual: PersonalScenario | null
  company: CompanyScenario
  curve: { salary: number; wealth: number; tax: number }[]
  vatRequired: boolean
  smeEligible: boolean
}

function personalScenario(input: CompanyInput, method: "standard" | "actual"): PersonalScenario {
  const item: IncomeItem = {
    id: "biz",
    category: input.personal.category,
    subtype: input.personal.subtype,
    amount: input.revenue,
    withheld: 0,
    expenseMethod: method,
    actualExpense: input.businessCosts + input.sharedCosts,
  }
  const result = computePersonal({
    profile: { year: input.year, status: "single", senior: false, disabled: false },
    incomes: [item],
    allowances: { other: input.otherAllowances },
    pnd94Paid: 0,
    foreignTaxCredit: 0,
  })
  const tax = result.taxDue
  return { kind: method, tax, cash: input.revenue - input.businessCosts - input.sharedCosts - tax, result }
}

export function companyAt(input: CompanyInput, salary: number): CompanyScenario {
  const ceiling = SSO_CEILING[input.year]
  const monthly = salary / 12
  const ssoEach = input.ownerInSso && salary > 0 ? Math.min(Math.max(monthly, 1_650), ceiling) * 0.05 * 12 : 0
  const pvdRate = Math.min(Math.max(input.pvdRate, 0), 0.15)
  const pvdEach = salary * pvdRate

  const depreciation = input.assets.reduce((s, a) => {
    const life = ASSET_LIFE[a.kind]
    const base = life.cap ? Math.min(a.price, life.cap) : a.price
    return s + base * life.rate
  }, 0)
  const doubleExtra = Math.max(0, input.doubleDeduction)
  const entertainmentCap = Math.min(Math.max(0.003 * input.revenue, 0.003 * input.registeredCapital), 10_000_000)
  const entertainmentAllowed = Math.min(input.entertainment, entertainmentCap)
  const carRentAllowed = Math.min(input.carRent, 36_000) * 12
  // Accounting fees are an ordinary deductible business expense for the company.
  const accounting = input.accountingMode === "package" ? Math.max(0, input.accountingPackage) : input.bookkeepingMonthly * 12 + input.audit
  const runningCosts = accounting + input.misc
  const formation = input.includeFormation ? (input.entity === "company" ? 5_600 : 1_100) : 0

  const cashCosts =
    input.businessCosts + input.sharedCosts + input.doubleDeduction + input.entertainment + runningCosts + formation + salary + ssoEach + pvdEach + input.homeOfficeRent * 12 + input.carRent * 12
  const deductible =
    input.businessCosts +
    input.sharedCosts +
    input.doubleDeduction +
    doubleExtra +
    entertainmentAllowed +
    runningCosts +
    formation +
    salary +
    ssoEach +
    pvdEach +
    input.homeOfficeRent * 12 +
    carRentAllowed +
    depreciation

  const profitBeforeTax = input.revenue - deductible
  const companyTax = cit(profitBeforeTax, input.sme)
  // Accounting profit: what was actually spent, plus depreciation, minus nothing for the 2x uplift.
  const accountingProfit = input.revenue - cashCosts - depreciation
  const afterTax = Math.max(0, accountingProfit - companyTax)
  const reserve = input.entity === "company" ? Math.min(afterTax * 0.05, Math.max(0, input.registeredCapital * 0.1)) : 0
  const dividend = round2((afterTax - reserve) * Math.min(Math.max(input.distribution, 0), 1))
  const retained = afterTax - dividend
  const fraction = creditFraction(profitBeforeTax, input.sme)
  const effectiveRate = fraction / (1 + fraction)

  const allowances: Record<string, number> = { other: input.otherAllowances, socialSecurity: ssoEach, pvd: pvdEach }
  // Monthly PND 1 withholding is worked out on salary alone, so the year's return settles only the rest.
  const salaryWithholding =
    salary > 0
      ? computePersonal({
          profile: { year: input.year, status: "single", senior: false, disabled: false },
          incomes: [{ id: "salary", category: "40_1", amount: salary, withheld: 0 }],
          allowances,
          pnd94Paid: 0,
          foreignTaxCredit: 0,
        }).taxDue
      : 0

  const baseIncomes: IncomeItem[] = []
  if (salary > 0) baseIncomes.push({ id: "salary", category: "40_1", amount: salary, withheld: salaryWithholding })
  if (input.homeOfficeRent > 0) baseIncomes.push({ id: "rentHome", category: "40_5", subtype: "building", amount: input.homeOfficeRent * 12, withheld: input.homeOfficeRent * 12 * 0.05 })
  if (input.carRent > 0) baseIncomes.push({ id: "rentCar", category: "40_5", subtype: "vehicle", amount: input.carRent * 12, withheld: input.carRent * 12 * 0.05 })

  const run = (included: boolean) => {
    const incomes = [...baseIncomes]
    if (dividend > 0)
      incomes.push({ id: "div", category: "40_4", subtype: "dividend", amount: dividend, withheld: dividend * 0.1, dividendRate: effectiveRate, excluded: !included })
    const result = computePersonal({
      profile: { year: input.year, status: "single", senior: false, disabled: false },
      incomes,
      allowances,
      pnd94Paid: 0,
      foreignTaxCredit: 0,
    })
    // Owner's real tax: tax due less the dividend credit, plus the 10% kept as final tax when excluded.
    const tax = result.taxDue - result.dividendCredit + result.finalWithholding
    return { result, tax }
  }
  const a = run(false)
  const b = dividend > 0 ? run(true) : a
  const pickIncluded = b.tax < a.tax
  const chosen = pickIncluded ? b : a

  const assetProceeds = input.assets.reduce((s, x) => s + x.price, 0)
  // A loss means the owner was paid money the company did not earn; it comes back out of the owner's pocket.
  const shortfall = Math.min(0, accountingProfit - companyTax)
  const cash = salary + dividend + input.homeOfficeRent * 12 + input.carRent * 12 - ssoEach - pvdEach - chosen.tax + shortfall
  const wealth = cash + pvdEach * 2 + retained * 0.9

  return {
    salary,
    sso: { employee: ssoEach, employer: ssoEach },
    pvd: { employee: pvdEach, employer: pvdEach },
    depreciation,
    doubleExtra,
    entertainmentAllowed,
    carRentAllowed,
    runningCosts,
    formation,
    profitBeforeTax,
    cit: companyTax,
    reserve,
    dividend,
    retained,
    creditFraction: fraction,
    dividendIncluded: pickIncluded,
    ownerTax: chosen.tax,
    ownerResult: chosen.result,
    payTax: a.result.taxDue,
    salaryWithholding,
    dividendTax: chosen.tax - a.result.taxDue,
    assetProceeds,
    cash,
    wealth,
    totalTax: companyTax + chosen.tax,
  }
}

export function compareStructures(input: CompanyInput): CompanyComparison {
  const standard = personalScenario(input, "standard")
  const allowsActual = input.personal.category !== "40_2" && input.personal.category !== "40_1"
  const actual = allowsActual ? personalScenario(input, "actual") : null

  const ceilingSalary = Math.max(0, input.revenue - input.businessCosts - input.sharedCosts)
  const step = ceilingSalary > 6_000_000 ? 50_000 : ceilingSalary > 2_000_000 ? 20_000 : 10_000
  const curve: CompanyComparison["curve"] = []
  let best: CompanyScenario | null = null
  for (let s = 0; s <= ceilingSalary + step; s += step) {
    const salary = Math.min(s, ceilingSalary)
    const sc = companyAt(input, salary)
    curve.push({ salary, wealth: sc.wealth, tax: sc.totalTax })
    if (!best || sc.wealth > best.wealth + 0.5) best = sc
    if (salary === ceilingSalary) break
  }
  const company = input.salaryMode === "fixed" ? companyAt(input, input.monthlySalary * 12) : (best ?? companyAt(input, 0))
  return {
    standard,
    actual,
    company,
    curve,
    vatRequired: input.revenue > 1_800_000,
    smeEligible: input.sme && input.revenue <= 30_000_000,
  }
}

/** Unregistered ordinary partnership: taxed as one person, then each partner's share is 40(8) with no expense. */
export function unregisteredPartnership(input: CompanyInput, partners: number) {
  const n = Math.max(2, Math.floor(partners))
  const entity = computePersonal({
    profile: { year: input.year, status: "single", senior: false, disabled: false },
    incomes: [
      {
        id: "p",
        category: input.personal.category,
        subtype: input.personal.subtype,
        amount: input.revenue,
        withheld: 0,
        expenseMethod: "standard",
      },
    ],
    // 60,000 per partner, capped at 120,000, replaces the personal allowance.
    allowances: { other: Math.min(n * 60_000, 120_000) - 60_000 },
    pnd94Paid: 0,
    foreignTaxCredit: 0,
  })
  const distributable = input.revenue - input.businessCosts - input.sharedCosts - entity.taxDue
  const share = Math.max(0, distributable / n)
  const partner = computePersonal({
    profile: { year: input.year, status: "single", senior: false, disabled: false },
    incomes: [{ id: "share", category: "40_8", subtype: "44", amount: share, withheld: 0, expenseMethod: "actual", actualExpense: 0 }],
    allowances: { other: input.otherAllowances },
    pnd94Paid: 0,
    foreignTaxCredit: 0,
  })
  const separately = computePersonal({
    profile: { year: input.year, status: "single", senior: false, disabled: false },
    incomes: [
      {
        id: "own",
        category: input.personal.category,
        subtype: input.personal.subtype,
        amount: input.revenue / n,
        withheld: 0,
        expenseMethod: "standard",
      },
    ],
    allowances: { other: input.otherAllowances },
    pnd94Paid: 0,
    foreignTaxCredit: 0,
  })
  return {
    partners: n,
    entityTax: entity.taxDue,
    partnerTaxEach: partner.taxDue,
    total: entity.taxDue + partner.taxDue * n,
    separatelyTotal: separately.taxDue * n,
  }
}
