/** A string written in both languages, English and Thai. */
export type L = { en: string; th: string }

export type TaxYear = 2568 | 2569 | 2570

export type IncomeCategory = "40_1" | "40_2" | "40_3" | "40_4" | "40_5" | "40_6" | "40_7" | "40_8"

export type FilingStatus =
  /** Single, widowed, divorced. */
  | "single"
  /** Married, spouse has no income all year. Spouse allowance applies. */
  | "married_no_income"
  /** Married, spouse has income and files their own return. */
  | "married_separate"

export type Profile = {
  year: TaxYear
  status: FilingStatus
  /** Taxpayer is 65 or older at any time in the tax year. */
  senior: boolean
  /** Taxpayer holds a disability card (under 65). */
  disabled: boolean
}

export type ExpenseMethod = "standard" | "actual"

export type IncomeItem = {
  id: string
  category: IncomeCategory
  /** Gross amount received in the year, before withholding. */
  amount: number
  /** Tax withheld at source, from the 50 Tawi certificate. */
  withheld: number
  /** Category-specific subtype key, such as a rental asset type or a 40(8) business code. */
  subtype?: string
  expenseMethod?: ExpenseMethod
  actualExpense?: number
  /**
   * 40(4)(b) dividends: the corporate income tax rate the paying company paid
   * on the profit distributed, which sets the dividend tax credit.
   */
  dividendRate?: number
  /**
   * Dividends and bank interest that carry a final withholding can be left out
   * of the return. False means the item is included and taxed at progressive rates.
   */
  excluded?: boolean
  note?: string
}

/** Amounts and counts entered against each allowance, keyed by allowance id. */
export type AllowanceInputs = Record<string, number>

export type PersonalInput = {
  profile: Profile
  incomes: IncomeItem[]
  allowances: AllowanceInputs
  /** Tax paid with a half-year PND 94 return. */
  pnd94Paid: number
  /** Foreign tax credit claimed under a double tax agreement. */
  foreignTaxCredit: number
}

export type Line = {
  key: string
  label: L
  amount: number
  note?: L
}

export type AllowanceResult = {
  id: string
  item: string
  label: L
  entered: number
  allowed: number
  cap?: number
  note?: L
}

export type FormKind = "PND90" | "PND91"
