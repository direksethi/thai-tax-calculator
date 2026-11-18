import { describe, expect, it } from "vitest"
import { travelDeduction } from "./allowances"
import { progressiveTax } from "./brackets"
import { cit, companyAt, compareStructures, creditFraction, unregisteredPartnership, type CompanyInput } from "./company"
import { computePersonal, propertyCompute, severanceCompute } from "./personal"
import type { PersonalInput } from "./types"

const base = (over: Partial<PersonalInput> = {}): PersonalInput => ({
  profile: { year: 2568, status: "single", senior: false, disabled: false },
  incomes: [],
  allowances: {},
  pnd94Paid: 0,
  foreignTaxCredit: 0,
  ...over,
})

describe("progressive tax", () => {
  it("matches the cumulative table", () => {
    expect(progressiveTax(150_000)).toBe(0)
    expect(progressiveTax(300_000)).toBe(7_500)
    expect(progressiveTax(500_000)).toBe(27_500)
    expect(progressiveTax(1_000_000)).toBe(115_000)
    expect(progressiveTax(5_000_000)).toBe(1_265_000)
  })
})

describe("personal income tax", () => {
  it("salary with provident fund, social security and life insurance (spec vector 1)", () => {
    const r = computePersonal(
      base({
        incomes: [{ id: "s", category: "40_1", amount: 600_000, withheld: 0 }],
        allowances: { pvd: 30_000, socialSecurity: 9_000, life: 20_000 },
      }),
    )
    expect(r.salaryBlock.exemptFunds).toBe(20_000)
    expect(r.allowances.total).toBe(99_000)
    expect(r.netIncome).toBe(381_000)
    expect(r.taxDue).toBe(15_600)
    expect(r.form).toBe("PND91")
  })

  it("minimum tax applies with actual expenses (spec vector 2)", () => {
    const actual = computePersonal(
      base({
        profile: { year: 2569, status: "single", senior: false, disabled: false },
        incomes: [{ id: "b", category: "40_8", subtype: "27", amount: 3_000_000, withheld: 0, expenseMethod: "actual", actualExpense: 2_900_000 }],
      }),
    )
    expect(actual.progressiveTax).toBe(0)
    expect(actual.minimumTaxApplies).toBe(true)
    expect(actual.taxDue).toBe(15_000)
    const standard = computePersonal(
      base({ incomes: [{ id: "b", category: "40_8", subtype: "27", amount: 3_000_000, withheld: 0, expenseMethod: "standard" }] }),
    )
    expect(standard.taxDue).toBe(150_000)
  })

  it("dividend credit gross-up at 20% (spec vector 3)", () => {
    const r = computePersonal(
      base({ incomes: [{ id: "d", category: "40_4", subtype: "dividend", amount: 80_000, withheld: 8_000, dividendRate: 0.2 }] }),
    )
    expect(r.dividendCredit).toBe(20_000)
    expect(r.incomeAfterExpenses).toBe(100_000)
    expect(r.minimumTaxBase).toBe(80_000)
    expect(r.balance).toBe(-28_000)
  })

  it("severance taxed separately without the zero band (spec vector 4)", () => {
    const s = severanceCompute({ statutory: 0, other: 400_000, wages400Days: 0, years: 10, withheld: 0, separate: true }, 0)
    expect(s.expense).toBe(235_000)
    expect(s.net).toBe(165_000)
    expect(s.tax).toBe(8_250)
  })

  it("inherited land sold, computed separately (spec vector 5)", () => {
    const p = propertyCompute({ price: 3_000_000, years: 5, acquired: "inherited", useActual: false, actualCost: 0, withheld: 0, mode: "separate" })
    expect(p.separateTax).toBe(75_000)
  })

  it("reproduces the 2568 PND 91 sample", () => {
    const r = computePersonal(
      base({
        incomes: [{ id: "s", category: "40_1", amount: 250_000, withheld: 0 }],
        allowances: { life: 2_254, health: 17_920 },
      }),
    )
    expect(r.salaryBlock.expense).toBe(100_000)
    expect(r.allowances.total).toBe(80_174)
    expect(r.netIncome).toBe(69_826)
    expect(r.taxDue).toBe(0)
    expect(r.mustFile).toBe(true)
  })

  it("puts the 65+ exemption where expenses are lowest", () => {
    const r = computePersonal(
      base({
        profile: { year: 2569, status: "single", senior: true, disabled: false },
        incomes: [
          { id: "i", category: "40_4", subtype: "interest", amount: 100_000, withheld: 15_000 },
          { id: "r", category: "40_5", subtype: "building", amount: 300_000, withheld: 0 },
        ],
      }),
    )
    // 100,000 on interest (no expense), 90,000 on rent (30% expense).
    expect(r.seniorExemptTotal).toBe(190_000)
    expect(r.incomeAfterExpenses).toBe(0 + (300_000 - 90_000) * 0.7)
  })

  it("caps life plus health at 100,000 and fills annuity from unused life room", () => {
    const r = computePersonal(
      base({
        incomes: [{ id: "s", category: "40_1", amount: 3_000_000, withheld: 0 }],
        allowances: { life: 90_000, health: 25_000, annuity: 250_000 },
      }),
    )
    const get = (id: string) => r.allowances.rows.find((x) => x.id === id)?.allowed ?? 0
    expect(get("health")).toBe(25_000)
    expect(get("life")).toBe(75_000)
    expect(get("annuity")).toBe(200_000)
  })

  it("domestic travel follows the RD worked example", () => {
    expect(travelDeduction({ secPaper: 6_000, secEtax: 4_000, mainPaper: 5_000, mainEtax: 7_000 }).deduction).toBe(25_000)
  })
})

const companyBase: CompanyInput = {
  year: 2569,
  personal: { category: "40_2" },
  revenue: 2_000_000,
  businessCosts: 0,
  sharedCosts: 0,
  otherAllowances: 0,
  entity: "company",
  sme: true,
  registeredCapital: 1_000_000,
  salaryMode: "optimize",
  monthlySalary: 0,
  ownerInSso: false,
  pvdRate: 0,
  homeOfficeRent: 0,
  carRent: 0,
  assets: [],
  doubleDeduction: 0,
  entertainment: 0,
  accountingMode: "itemized",
  accountingPackage: 0,
  bookkeepingMonthly: 3_000,
  audit: 15_000,
  misc: 5_000,
  includeFormation: false,
  distribution: 1,
}

describe("company", () => {
  it("SME CIT bands", () => {
    expect(cit(1_000_000, true)).toBe(105_000)
    expect(cit(1_000_000, false)).toBe(200_000)
    expect(cit(250_000, true)).toBe(0)
  })

  it("averaged dividend credit equals CIT when everything is paid out (D1)", () => {
    const f = creditFraction(1_000_000, true)
    expect(Math.round(895_000 * f)).toBe(105_000)
  })

  it("salary of 1,160,000 matches spec example E4", () => {
    const sc = companyAt(companyBase, 1_160_000)
    expect(sc.profitBeforeTax).toBe(784_000)
    expect(sc.cit).toBe(72_600)
    expect(sc.reserve).toBe(35_570)
    expect(sc.dividend).toBe(675_830)
    expect(sc.dividendIncluded).toBe(false)
    expect(Math.round(sc.ownerTax)).toBe(182_583)
    expect(Math.round(sc.totalTax)).toBe(255_183)
    expect(Math.round(sc.cash)).toBe(1_653_247)
    // Split: salary tax withheld monthly, then the 10% final dividend tax.
    expect(sc.payTax).toBe(115_000)
    expect(sc.salaryWithholding).toBe(115_000)
    expect(Math.round(sc.dividendTax)).toBe(67_583)
    expect(sc.ownerResult.balance).toBe(0)
  })

  it("a one-fee accountant is a deductible running cost", () => {
    const sc = companyAt({ ...companyBase, accountingMode: "package", accountingPackage: 25_000, misc: 0 }, 1_160_000)
    expect(sc.runningCosts).toBe(25_000)
    expect(sc.profitBeforeTax).toBe(2_000_000 - 25_000 - 1_160_000)
  })

  it("salary 0 picks inclusion (E4 first row)", () => {
    const sc = companyAt(companyBase, 0)
    expect(sc.cit).toBe(246_600)
    expect(sc.dividendIncluded).toBe(true)
    expect(Math.round(sc.totalTax)).toBe(324_030)
  })

  it("personal comparisons E1 and E3", () => {
    expect(compareStructures(companyBase).standard.tax).toBe(325_000)
    const e3 = compareStructures({ ...companyBase, personal: { category: "40_8", subtype: "27" }, revenue: 3_000_000, businessCosts: 1_000_000 })
    expect(e3.standard.tax).toBe(150_000)
    expect(e3.actual?.tax).toBe(350_000)
  })

  it("unregistered partnership E6", () => {
    const p = unregisteredPartnership({ ...companyBase, personal: { category: "40_8", subtype: "27" }, revenue: 3_000_000, businessCosts: 1_000_000 }, 2)
    expect(p.entityTax).toBe(135_000)
    expect(p.total).toBe(314_000)
    expect(p.separatelyTotal).toBe(67_000)
  })
})
