import type { L } from "./types"
import { computeAllowances, type AllowanceComputation } from "./allowances"
import { marginalRate, progressiveSteps, progressiveTax, round2, type BracketStep } from "./brackets"
import { CATEGORY_BY_ID, itemExpense, subtypeOf } from "./income"
import type { FormKind, IncomeCategory, IncomeItem, PersonalInput } from "./types"
import { YEARS } from "./years"

export type CategorySummary = {
  category: IncomeCategory
  gross: number
  exempt: number
  expense: number
  net: number
  withheld: number
}

export type FormRow = { no: string; label: L; amount: number | null; tone?: "total" | "minus" | "muted" }

export type SeveranceInput = {
  /** Statutory severance for involuntary termination, before its exemption. */
  statutory: number
  /** Gratuity, taxable provident fund payout and other one-time payments on leaving. */
  other: number
  /** Last 400 days of wages, the ceiling on the statutory exemption. */
  wages400Days: number
  years: number
  withheld: number
  /** Taxed on the severance attachment instead of with salary. Requires 5 full years of service. */
  separate: boolean
}

export type SeveranceResult = {
  income: number
  statutoryExempt: number
  seniorExempt: number
  expense: number
  net: number
  tax: number
  withheld: number
  separate: boolean
  eligibleSeparate: boolean
}

export type PropertyMode = "final" | "separate" | "combine"

export type PropertyInput = {
  price: number
  /** Calendar years from acquisition to transfer, part years count as one, capped at 10. */
  years: number
  acquired: "inherited" | "bought"
  useActual: boolean
  actualCost: number
  withheld: number
  mode: PropertyMode
}

export type PropertyResult = {
  price: number
  expense: number
  net: number
  years: number
  separateTax: number
  withheld: number
  mode: PropertyMode
}

export type PersonalResult = {
  form: FormKind
  mustFile: boolean
  filingThreshold: number
  totalGross: number
  assessable: number
  limitBase: number
  categories: CategorySummary[]
  salaryBlock: { salary: number; fees: number; exemptFunds: number; seniorExempt: number; severanceExempt: number; expense: number; net: number }
  seniorExemptTotal: number
  incomeAfterExpenses: number
  allowances: AllowanceComputation
  afterAllowances: number
  donation2x: number
  donation1x: number
  netIncome: number
  progressiveTax: number
  minimumTax: number
  minimumTaxBase: number
  minimumTaxApplies: boolean
  taxDue: number
  foreignCredit: number
  withheld: number
  dividendCredit: number
  pnd94Paid: number
  finalWithholding: number
  balance: number
  severance?: SeveranceResult
  property?: PropertyResult
  effectiveRate: number
  marginalRate: number
  steps: BracketStep[]
  warnings: L[]
}

const SENIOR_EXEMPTION = 190_000
const PROPERTY_DEEMED = [0.92, 0.84, 0.77, 0.71, 0.65, 0.6, 0.55, 0.5]

/**
 * Progressive tax without the 150,000 zero band, which only exists for net
 * income under section 48(1). Severance and real-estate computations use this.
 */
export function taxNoExemption(net: number): number {
  return round2(progressiveTax(net) + 0.05 * Math.min(Math.max(0, net), 150_000))
}

export function dividendCredit(item: IncomeItem): number {
  if (item.category !== "40_4" || (item.subtype ?? "dividend") !== "dividend" || item.excluded) return 0
  const rate = item.dividendRate ?? 0.2
  if (rate <= 0) return 0
  return round2((item.amount * rate) / (1 - rate))
}

/** Interest and Thai dividends may be left out of the return when tax was withheld as a final tax. */
export function canExclude(item: IncomeItem): boolean {
  if (item.category !== "40_4") return false
  const sub = item.subtype ?? "dividend"
  return sub === "dividend" || sub === "fund" || sub === "interest"
}

export function severanceCompute(s: SeveranceInput, seniorRoom: number): SeveranceResult {
  const statutoryExempt = Math.min(s.statutory, Math.max(0, s.wages400Days), 600_000)
  const income = Math.max(0, s.statutory - statutoryExempt) + Math.max(0, s.other)
  const years = Math.max(0, Math.floor(s.years))
  const eligibleSeparate = years >= 5
  const separate = s.separate && eligibleSeparate
  if (!separate) {
    return { income, statutoryExempt, seniorExempt: 0, expense: 0, net: income, tax: 0, withheld: Math.max(0, s.withheld), separate, eligibleSeparate }
  }
  const seniorExempt = Math.min(seniorRoom, income)
  const base = income - seniorExempt
  const part1 = Math.min(base, 7_000 * years)
  const part2 = (base - part1) * 0.5
  const expense = part1 + part2
  const net = Math.max(0, base - expense)
  return { income, statutoryExempt, seniorExempt, expense, net, tax: taxNoExemption(net), withheld: Math.max(0, s.withheld), separate, eligibleSeparate }
}

export function propertyCompute(p: PropertyInput): PropertyResult {
  const years = Math.min(10, Math.max(1, Math.ceil(p.years)))
  const price = Math.max(0, p.price)
  let expense: number
  if (p.acquired === "inherited") expense = price * 0.5
  else if (p.useActual) expense = Math.min(price, Math.max(0, p.actualCost))
  else expense = price * PROPERTY_DEEMED[Math.min(years, 8) - 1]
  const net = Math.max(0, price - expense)
  const separateTax = Math.min(round2(taxNoExemption(net / years) * years), price * 0.2)
  return { price, expense, net, years, separateTax, withheld: Math.max(0, p.withheld), mode: p.mode }
}

type Slot = { key: string; capacity: number; reduction: number }

export function computePersonal(input: PersonalInput & { severance?: SeveranceInput; property?: PropertyInput }): PersonalResult {
  const { profile } = input
  const year = YEARS[profile.year]
  const warnings: L[] = []
  const incomes = input.incomes.filter((i) => i.amount > 0)

  const included = incomes.filter((i) => !(canExclude(i) && i.excluded))
  const excluded = incomes.filter((i) => canExclude(i) && i.excluded)
  const finalWithholding = excluded.reduce((s, i) => s + i.withheld, 0)

  const sum = (list: IncomeItem[], cat: IncomeCategory) => list.filter((i) => i.category === cat).reduce((s, i) => s + i.amount, 0)
  const salaryOnly = sum(included, "40_1")
  const fees = sum(included, "40_2")
  const dividendCredits = included.reduce((s, i) => s + dividendCredit(i), 0)

  // Severance: the statutory part is exempt up to 400 days of wages (max 600,000); the rest is
  // either taxed with salary or, with 5+ years of service, separately on its own attachment.
  let seniorRoom = profile.senior || profile.disabled ? SENIOR_EXEMPTION : 0
  const sevInput = input.severance && input.severance.statutory + input.severance.other > 0 ? input.severance : undefined
  let severance: SeveranceResult | undefined
  let severanceWithSalary = 0
  if (sevInput && !(sevInput.separate && Math.floor(sevInput.years) >= 5)) {
    severance = severanceCompute(sevInput, 0)
    severanceWithSalary = severance.income
  }
  const salary = salaryOnly + severanceWithSalary

  const property = input.property && input.property.price > 0 ? propertyCompute(input.property) : undefined
  const propertyCombined = property?.mode === "combine" ? property : undefined

  const assessable = included.reduce((s, i) => s + i.amount, 0) + severanceWithSalary + (propertyCombined?.price ?? 0)
  const totalGross = incomes.reduce((s, i) => s + i.amount, 0) + (sevInput ? sevInput.statutory + sevInput.other : 0) + (property?.price ?? 0)
  // The RMF, Thai ESG and annuity limits also count income taxed finally at source.
  const limitBase = assessable + excluded.reduce((s, i) => s + i.amount, 0)

  const hasBusiness = included.some((i) => ["40_5", "40_6", "40_7", "40_8"].includes(i.category))
  const hasActualBusiness = included.some((i) => ["40_5", "40_6", "40_7", "40_8"].includes(i.category) && itemExpense(i).method === "actual")

  const allowances = computeAllowances(input.allowances, {
    year: profile.year,
    status: profile.status,
    assessable: limitBase,
    salary: salaryOnly,
    hasActualBusiness,
    hasBusiness,
  })

  const exemptFunds = allowances.exemptFunds.pvd + allowances.exemptFunds.gpf + allowances.exemptFunds.teacher
  const salaryBase0 = Math.max(0, salary - exemptFunds) + fees

  // The 190,000 exemption for people 65+ (or disabled) comes off gross income before expenses,
  // from whichever categories the filer chooses. Placing it where expenses are lowest saves most.
  const others = included.filter((i) => i.category !== "40_1" && i.category !== "40_2")
  const slots: Slot[] = []
  if (salaryBase0 > 0) {
    slots.push({ key: "salary-top", capacity: Math.max(0, salaryBase0 - 200_000), reduction: 1 })
    slots.push({ key: "salary-low", capacity: Math.min(salaryBase0, 200_000), reduction: 0.5 })
  }
  for (const item of others) {
    const e = itemExpense(item)
    const rate = e.method === "standard" ? (e.rate ?? 0) : 0
    slots.push({ key: item.id, capacity: item.amount, reduction: 1 - rate })
  }
  slots.sort((a, b) => b.reduction - a.reduction)
  const seniorBy = new Map<string, number>()
  for (const slot of slots) {
    if (seniorRoom <= 0) break
    const used = Math.min(slot.capacity, seniorRoom)
    seniorRoom -= used
    const key = slot.key.startsWith("salary") ? "salary" : slot.key
    seniorBy.set(key, (seniorBy.get(key) ?? 0) + used)
  }
  const seniorOnSalary = seniorBy.get("salary") ?? 0

  // Salary block: PND 90 item 1 / PND 91 section ก lines 1 to 5.
  const salaryBase = Math.max(0, salaryBase0 - seniorOnSalary)
  const salaryExpense = Math.min(salaryBase * 0.5, 100_000)
  const salaryNet = salaryBase - salaryExpense

  // Other categories, item by item. Rights under 40(3) share one 100,000 cap on the 50% deduction.
  let rightsRoom = 100_000
  const categories: CategorySummary[] = []
  let otherNet = 0
  for (const cat of ["40_3", "40_4", "40_5", "40_6", "40_7", "40_8"] as IncomeCategory[]) {
    const items = included.filter((i) => i.category === cat)
    if (items.length === 0) continue
    let gross = 0
    let exempt = 0
    let expense = 0
    let withheld = 0
    for (const item of items) {
      const credit = dividendCredit(item)
      const itemExempt = seniorBy.get(item.id) ?? 0
      gross += item.amount + credit
      exempt += itemExempt
      withheld += item.withheld
      const reduced: IncomeItem = { ...item, amount: item.amount - itemExempt }
      const e = itemExpense(reduced)
      let amount = e.amount
      if (cat === "40_3" && e.method === "standard" && subtypeOf(item)?.key !== "annuity") {
        amount = Math.min(amount, rightsRoom)
        rightsRoom -= amount
      }
      expense += amount
    }
    const net = Math.max(0, gross - exempt - expense)
    otherNet += net
    categories.push({ category: cat, gross, exempt, expense, net, withheld })
  }
  if (salary + fees > 0) {
    categories.unshift({
      category: salary > 0 ? "40_1" : "40_2",
      gross: salary + fees,
      exempt: exemptFunds + seniorOnSalary,
      expense: salaryExpense,
      net: salaryNet,
      withheld: included.filter((i) => i.category === "40_1" || i.category === "40_2").reduce((s, i) => s + i.withheld, 0) + (severanceWithSalary > 0 ? (severance?.withheld ?? 0) : 0),
    })
  }

  // A separate severance computation can still use whatever is left of the 190,000.
  if (sevInput && !severance) severance = severanceCompute(sevInput, seniorRoom)

  const propertyNet = propertyCombined ? propertyCombined.net : 0
  const incomeAfterExpenses = salaryNet + otherNet + propertyNet
  const afterAllowances = Math.max(0, incomeAfterExpenses - allowances.total)
  const donation2x = Math.min(allowances.donations.twice * 2, afterAllowances * 0.1)
  const afterDonation2x = afterAllowances - donation2x
  const donation1x = Math.min(allowances.donations.once, afterDonation2x * 0.1)
  const netIncome = Math.max(0, afterDonation2x - donation1x)

  const pTax = progressiveTax(netIncome)
  // Minimum tax base: gross income other than salary, without the dividend credit gross-up.
  const minimumTaxBase = assessable - salary
  const minimumTax = minimumTaxBase >= 120_000 ? round2(minimumTaxBase * 0.005) : 0
  const minimumTaxApplies = minimumTax > 5_000 && minimumTax > pTax
  const taxDue = minimumTaxApplies ? minimumTax : pTax

  const foreignCredit = Math.min(Math.max(0, input.foreignTaxCredit), taxDue)
  const withheld =
    included.reduce((s, i) => s + i.withheld, 0) + (severanceWithSalary > 0 ? (severance?.withheld ?? 0) : 0) + (propertyCombined?.withheld ?? 0)
  const pnd94Paid = Math.max(0, input.pnd94Paid)

  const severanceBalance = severance?.separate ? severance.tax - severance.withheld : 0
  const propertyBalance = property?.mode === "separate" ? property.separateTax - property.withheld : 0

  const balance = round2(taxDue - foreignCredit - withheld - dividendCredits - pnd94Paid + severanceBalance + propertyBalance)

  const onlySalary = included.every((i) => i.category === "40_1") && !propertyCombined && property?.mode !== "separate"
  const form: FormKind = onlySalary ? "PND91" : "PND90"
  const married = profile.status !== "single"
  const filingThreshold = onlySalary ? (married ? 220_000 : 120_000) : married ? 120_000 : 60_000
  const mustFile = assessable > filingThreshold || (severance?.separate ?? false) || property?.mode === "separate"

  if (dividendCredits > 0)
    warnings.push({
      en: "Including Thai dividends means every Thai dividend and fund distribution received in the year must be included.",
      th: "เมื่อนำเงินปันผลมารวมคำนวณ ต้องนำเงินปันผลจากบริษัทไทยและกองทุนรวมทั้งปีมารวมทั้งหมด",
    })
  if (year.provisional)
    warnings.push({
      en: "The 2569 return and attachment are not published yet. Figures follow the 2568 forms and the measures announced so far.",
      th: "แบบและใบแนบปีภาษี 2569 ยังไม่ประกาศ ผลลัพธ์อ้างอิงแบบปี 2568 และมาตรการที่ประกาศแล้ว",
    })
  if (minimumTaxApplies)
    warnings.push({
      en: "The 0.5% minimum tax on non-salary income is higher than tax at progressive rates, so it applies.",
      th: "ภาษีขั้นต่ำร้อยละ 0.5 ของเงินได้ที่ไม่ใช่เงินเดือนสูงกว่าภาษีตามอัตราก้าวหน้า จึงต้องเสียตามภาษีขั้นต่ำ",
    })
  if (sevInput?.separate && severance && !severance.eligibleSeparate)
    warnings.push({
      en: "Separate taxation of severance needs 5 full years of service, so it is taxed with salary.",
      th: "การแยกคำนวณภาษีเงินได้กรณีออกจากงานต้องทำงานครบ 5 ปี จึงนำไปรวมกับเงินเดือน",
    })
  if (!onlySalary && !mustFile && withheld > 0)
    warnings.push({ en: "Filing is optional at this income, but filing returns the tax withheld.", th: "เงินได้ระดับนี้ไม่ต้องยื่นแบบ แต่การยื่นแบบจะได้รับคืนภาษีที่ถูกหักไว้" })

  return {
    form,
    mustFile,
    filingThreshold,
    totalGross,
    assessable,
    limitBase,
    categories,
    salaryBlock: {
      salary,
      fees,
      exemptFunds,
      seniorExempt: seniorOnSalary,
      severanceExempt: severance?.statutoryExempt ?? 0,
      expense: salaryExpense,
      net: salaryNet,
    },
    seniorExemptTotal: [...seniorBy.values()].reduce((a, b) => a + b, 0) + (severance?.seniorExempt ?? 0),
    incomeAfterExpenses,
    allowances,
    afterAllowances,
    donation2x,
    donation1x,
    netIncome,
    progressiveTax: pTax,
    minimumTax,
    minimumTaxBase,
    minimumTaxApplies,
    taxDue,
    foreignCredit,
    withheld,
    dividendCredit: dividendCredits,
    pnd94Paid,
    finalWithholding,
    balance,
    severance,
    property,
    effectiveRate: totalGross > 0 ? (taxDue + (severance?.separate ? severance.tax : 0) + (property?.mode === "separate" ? property.separateTax : 0)) / totalGross : 0,
    marginalRate: marginalRate(netIncome),
    steps: progressiveSteps(netIncome),
    warnings,
  }
}

/** Lines of PND 91 section ก or PND 90 item 11, in form order. */
export function formRows(r: PersonalResult): FormRow[] {
  const pay = (no: string): FormRow => ({
    no,
    label: r.balance >= 0 ? { en: "Tax to pay", th: "ภาษีที่ชำระเพิ่มเติม" } : { en: "Tax overpaid, refundable", th: "ภาษีที่ชำระไว้เกิน" },
    amount: Math.abs(r.balance),
    tone: "total",
  })
  if (r.form === "PND91") {
    const salary = r.salaryBlock.salary
    const exempt = r.salaryBlock.exemptFunds + r.salaryBlock.seniorExempt
    return [
      { no: "1", label: { en: "Salary, wages, pension", th: "เงินเดือน ค่าจ้าง บำนาญ" }, amount: salary },
      { no: "2", label: { en: "Less exempt income (from section ข line 6)", th: "หัก เงินได้ที่ได้รับยกเว้น (ยกมาจาก ข 6.)" }, amount: exempt, tone: "minus" },
      { no: "3", label: { en: "Balance", th: "คงเหลือ (1. - 2.)" }, amount: salary - exempt },
      { no: "4", label: { en: "Less expenses, 50% up to 100,000", th: "หัก ค่าใช้จ่าย ร้อยละ 50 ไม่เกิน 100,000 บาท" }, amount: r.salaryBlock.expense, tone: "minus" },
      { no: "5", label: { en: "Balance", th: "คงเหลือ (3. - 4.)" }, amount: r.salaryBlock.net },
      { no: "6", label: { en: "Less allowances (attachment item 24)", th: "หัก รายการค่าลดหย่อน (ใบแนบ ข้อ 24)" }, amount: r.allowances.total, tone: "minus" },
      { no: "7", label: { en: "Balance", th: "คงเหลือ (5. - 6.)" }, amount: r.afterAllowances },
      { no: "8", label: { en: "Less donations counted twice, up to 10% of line 7", th: "หัก เงินบริจาค 2 เท่า ไม่เกินร้อยละ 10 ของ 7." }, amount: r.donation2x, tone: "minus" },
      { no: "9", label: { en: "Balance", th: "คงเหลือ (7. - 8.)" }, amount: r.afterAllowances - r.donation2x },
      { no: "10", label: { en: "Less donations, up to 10% of line 9", th: "หัก เงินบริจาค ไม่เกินร้อยละ 10 ของ 9." }, amount: r.donation1x, tone: "minus" },
      { no: "11", label: { en: "Net income", th: "เงินได้สุทธิ" }, amount: r.netIncome, tone: "total" },
      { no: "12", label: { en: "Tax on net income", th: "ภาษีคำนวณจากเงินได้สุทธิ" }, amount: r.taxDue },
      { no: "13", label: { en: "Less foreign tax credit", th: "หัก เครดิตภาษีเงินได้จากต่างประเทศ" }, amount: r.foreignCredit, tone: "minus" },
      { no: "14", label: { en: "Tax after foreign credit", th: "ภาษีที่ต้องชำระหลังหักเครดิตภาษีต่างประเทศ" }, amount: r.taxDue - r.foreignCredit },
      { no: "15", label: { en: "Less tax withheld", th: "หัก ภาษีเงินได้หัก ณ ที่จ่าย" }, amount: r.withheld, tone: "minus" },
      ...severanceRows(r, "17", "18"),
      pay(r.severance?.separate ? "20" : "16"),
    ]
  }
  return [
    { no: "1", label: { en: "Income after expenses (items 1 to 7)", th: "เงินได้หลังหักค่าใช้จ่าย (ข้อ 1 ถึง 7)" }, amount: r.incomeAfterExpenses },
    { no: "2", label: { en: "Less allowances (attachment item 24)", th: "หัก ค่าลดหย่อน (ใบแนบ ข้อ 24)" }, amount: r.allowances.total, tone: "minus" },
    { no: "3", label: { en: "Balance", th: "คงเหลือ (1. - 2.)" }, amount: r.afterAllowances },
    { no: "4", label: { en: "Less donations counted twice, up to 10% of line 3", th: "หัก เงินบริจาค 2 เท่า ไม่เกินร้อยละ 10 ของ 3." }, amount: r.donation2x, tone: "minus" },
    { no: "5", label: { en: "Balance", th: "คงเหลือ (3. - 4.)" }, amount: r.afterAllowances - r.donation2x },
    { no: "6", label: { en: "Less donations, up to 10% of line 5", th: "หัก เงินบริจาค ไม่เกินร้อยละ 10 ของ 5." }, amount: r.donation1x, tone: "minus" },
    { no: "7", label: { en: "Net income", th: "เงินได้สุทธิ" }, amount: r.netIncome, tone: "total" },
    { no: "8", label: { en: "Tax at progressive rates", th: "ภาษีคำนวณจากเงินได้สุทธิ" }, amount: r.progressiveTax },
    { no: "9", label: { en: "Minimum tax, 0.5% of non-salary income", th: "ภาษีคำนวณจากเงินได้พึงประเมิน ร้อยละ 0.5" }, amount: r.minimumTax, tone: "muted" },
    { no: "10", label: { en: "Tax due, the higher of 8 and 9", th: "ภาษีที่ต้องชำระ (8. หรือ 9. แล้วแต่จำนวนใดมากกว่า)" }, amount: r.taxDue },
    { no: "13", label: { en: "Less foreign tax credit", th: "หัก เครดิตภาษีเงินได้จากต่างประเทศ" }, amount: r.foreignCredit, tone: "minus" },
    { no: "14", label: { en: "Tax after foreign credit", th: "ภาษีหลังหักเครดิตภาษีต่างประเทศ" }, amount: r.taxDue - r.foreignCredit },
    { no: "15", label: { en: "Less tax withheld, dividend credit and PND 94", th: "หัก ภาษีหัก ณ ที่จ่าย เครดิตภาษีเงินปันผล และ ภ.ง.ด.94" }, amount: r.withheld + r.dividendCredit + r.pnd94Paid, tone: "minus" },
    ...(r.property?.mode === "separate"
      ? [{ no: "17", label: { en: "Tax on property sale, computed separately (item 8)", th: "ภาษีจากการขายอสังหาริมทรัพย์ แยกคำนวณ (ข้อ 8)" }, amount: r.property.separateTax - r.property.withheld } as FormRow]
      : []),
    ...severanceRows(r, "20", "21"),
    pay("25"),
  ]
}

function severanceRows(r: PersonalResult, payNo: string, refundNo: string): FormRow[] {
  if (!r.severance?.separate) return []
  const s = r.severance.tax - r.severance.withheld
  return s >= 0
    ? [{ no: payNo, label: { en: "Plus tax on severance, computed separately", th: "บวก ภาษีจากเงินได้กรณีออกจากงาน" }, amount: s }]
    : [{ no: refundNo, label: { en: "Less overpaid tax on severance", th: "หัก ภาษีที่ชำระไว้เกินกรณีออกจากงาน" }, amount: -s, tone: "minus" }]
}

export const CATEGORY_LABEL = (c: IncomeCategory) => CATEGORY_BY_ID[c].label
