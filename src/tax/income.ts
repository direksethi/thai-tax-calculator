import type { L } from "./types"
import type { IncomeCategory, IncomeItem } from "./types"
import { BUSINESS_TYPES, performerExpense } from "./business-types"

export type Subtype = {
  key: string
  label: L
  /** Standard (deemed) expense rate; null means actual expenses only. */
  rate: number | null
  /** Taxed with no expense deduction at all. */
  noExpense?: boolean
  hint?: L
}

export type CategoryDef = {
  id: IncomeCategory
  section: string
  label: L
  short: L
  examples: L
  subtypes?: Subtype[]
  allowActual: boolean
  /** Typical withholding rate on this income, used as a starting point. */
  typicalWithholding?: number
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "40_1",
    section: "40(1)",
    label: { en: "Salary and wages", th: "เงินเดือน ค่าจ้าง" },
    short: { en: "Salary", th: "เงินเดือน" },
    examples: { en: "Salary, wages, bonus, pension, allowances and benefits from an employer.", th: "เงินเดือน ค่าจ้าง โบนัส บำนาญ เบี้ยเลี้ยง และประโยชน์ที่ได้รับจากนายจ้าง" },
    allowActual: false,
  },
  {
    id: "40_2",
    section: "40(2)",
    label: { en: "Fees and commissions", th: "ค่าธรรมเนียม ค่านายหน้า" },
    short: { en: "Fees", th: "ค่าจ้างทั่วไป" },
    examples: { en: "Freelance fees for work or a position, commissions, brokerage, meeting allowances, director fees.", th: "ค่าจ้างฟรีแลนซ์จากหน้าที่หรืองานที่ทำ ค่านายหน้า ค่าธรรมเนียม เบี้ยประชุม ค่าตอบแทนกรรมการ" },
    allowActual: false,
    typicalWithholding: 0.03,
  },
  {
    id: "40_3",
    section: "40(3)",
    label: { en: "Royalties and rights", th: "ค่าลิขสิทธิ์และสิทธิอื่น" },
    short: { en: "Royalties", th: "ค่าลิขสิทธิ์" },
    examples: { en: "Copyright, goodwill, patents, franchise fees, annuities from wills.", th: "ค่าลิขสิทธิ์ ค่าแห่งกู๊ดวิลล์ สิทธิบัตร ค่าแฟรนไชส์ เงินปีที่ได้จากพินัยกรรม" },
    allowActual: true,
    typicalWithholding: 0.03,
    subtypes: [
      { key: "copyright", label: { en: "Copyright", th: "ค่าแห่งลิขสิทธิ์" }, rate: 0.5, hint: { en: "50% or actual. The 50% is capped at 100,000 across all rights.", th: "ร้อยละ 50 หรือตามจริง ร้อยละ 50 รวมทุกสิทธิไม่เกิน 100,000 บาท" } },
      { key: "other", label: { en: "Goodwill, patents, franchises, other rights", th: "ค่าแห่งกู๊ดวิลล์ สิทธิบัตร แฟรนไชส์ สิทธิอื่น" }, rate: 0.5, hint: { en: "50% or actual. The 50% is capped at 100,000 across all rights.", th: "ร้อยละ 50 หรือตามจริง ร้อยละ 50 รวมทุกสิทธิไม่เกิน 100,000 บาท" } },
      { key: "annuity", label: { en: "Annuity from a will or court order", th: "เงินปีจากพินัยกรรมหรือคำพิพากษา" }, rate: 0, noExpense: true },
    ],
  },
  {
    id: "40_4",
    section: "40(4)",
    label: { en: "Interest, dividends and gains", th: "ดอกเบี้ย เงินปันผล และผลประโยชน์" },
    short: { en: "Investment", th: "การลงทุน" },
    examples: { en: "Bank and bond interest, dividends, fund distributions, crypto and digital token gains.", th: "ดอกเบี้ยเงินฝากและพันธบัตร เงินปันผล เงินส่วนแบ่งจากกองทุน กำไรจากคริปโทเคอร์เรนซีและโทเคนดิจิทัล" },
    allowActual: false,
    subtypes: [
      { key: "dividend", label: { en: "Thai company dividends", th: "เงินปันผลจากบริษัทไทย" }, rate: 0, noExpense: true },
      { key: "fund", label: { en: "Mutual fund distributions", th: "เงินปันผลจากกองทุนรวม" }, rate: 0, noExpense: true },
      { key: "interest", label: { en: "Bank or bond interest", th: "ดอกเบี้ยเงินฝากหรือพันธบัตร" }, rate: 0, noExpense: true },
      { key: "crypto", label: { en: "Crypto gains outside licensed Thai exchanges", th: "กำไรจากคริปโทที่ไม่ได้ขายผ่านผู้ให้บริการที่ได้รับอนุญาตในไทย" }, rate: 0, noExpense: true, hint: { en: "Gains through SEC-licensed Thai exchanges are exempt from 2568 to 2572. Enter only gains from foreign exchanges, DeFi or peer-to-peer.", th: "กำไรที่ขายผ่านศูนย์ซื้อขายที่ได้รับอนุญาตจาก ก.ล.ต. ได้รับยกเว้นปี 2568 ถึง 2572 กรอกเฉพาะกำไรจากต่างประเทศ DeFi หรือ P2P" } },
      { key: "tokenShare", label: { en: "Profit share from holding digital tokens", th: "ส่วนแบ่งกำไรจากการถือโทเคนดิจิทัล" }, rate: 0, noExpense: true },
      { key: "foreignDividend", label: { en: "Foreign dividends brought into Thailand", th: "เงินปันผลจากต่างประเทศที่นำเข้ามา" }, rate: 0, noExpense: true },
      { key: "other", label: { en: "Other investment income", th: "เงินได้จากการลงทุนอื่น" }, rate: 0, noExpense: true },
    ],
  },
  {
    id: "40_5",
    section: "40(5)",
    label: { en: "Rent", th: "ค่าเช่าทรัพย์สิน" },
    short: { en: "Rent", th: "ค่าเช่า" },
    examples: { en: "Rent from a house, condo, land, car or equipment.", th: "ค่าเช่าบ้าน คอนโด ที่ดิน รถยนต์ หรืออุปกรณ์" },
    allowActual: true,
    typicalWithholding: 0.05,
    subtypes: [
      { key: "building", label: { en: "Houses, buildings and floating homes", th: "บ้าน โรงเรือน สิ่งปลูกสร้าง แพ" }, rate: 0.3 },
      { key: "farmland", label: { en: "Farmland", th: "ที่ดินที่ใช้ในการเกษตร" }, rate: 0.2 },
      { key: "land", label: { en: "Other land", th: "ที่ดินที่มิได้ใช้ในการเกษตร" }, rate: 0.15 },
      { key: "vehicle", label: { en: "Vehicles", th: "ยานพาหนะ" }, rate: 0.3 },
      { key: "other", label: { en: "Other property", th: "ทรัพย์สินอื่น" }, rate: 0.1 },
      { key: "hirePurchase", label: { en: "Forfeited hire-purchase payments", th: "การผิดสัญญาเช่าซื้อ" }, rate: 0.2 },
    ],
  },
  {
    id: "40_6",
    section: "40(6)",
    label: { en: "Liberal professions", th: "วิชาชีพอิสระ" },
    short: { en: "Profession", th: "วิชาชีพอิสระ" },
    examples: { en: "Licensed medicine, law, engineering, architecture, accounting and fine arts.", th: "การประกอบโรคศิลปะ กฎหมาย วิศวกรรม สถาปัตยกรรม การบัญชี และประณีตศิลปกรรม" },
    allowActual: true,
    typicalWithholding: 0.03,
    subtypes: [
      { key: "medical", label: { en: "Medicine (licensed)", th: "การประกอบโรคศิลปะ" }, rate: 0.6 },
      { key: "fineArts", label: { en: "Fine arts", th: "ประณีตศิลปกรรม" }, rate: 0.6 },
      { key: "other", label: { en: "Law, engineering, architecture, accounting", th: "กฎหมาย วิศวกรรม สถาปัตยกรรม การบัญชี" }, rate: 0.3 },
    ],
  },
  {
    id: "40_7",
    section: "40(7)",
    label: { en: "Contracting", th: "รับเหมา" },
    short: { en: "Contracting", th: "รับเหมา" },
    examples: { en: "Contract work where you supply the essential materials as well as labour.", th: "การรับเหมาที่ผู้รับเหมาต้องลงทุนจัดหาสัมภาระในส่วนสำคัญนอกจากเครื่องมือ" },
    allowActual: true,
    typicalWithholding: 0.03,
    subtypes: [{ key: "contract", label: { en: "Contracting with materials", th: "รับเหมาที่จัดหาสัมภาระ" }, rate: 0.6 }],
  },
  {
    id: "40_8",
    section: "40(8)",
    label: { en: "Business and other income", th: "ธุรกิจ การพาณิชย์ และอื่น ๆ" },
    short: { en: "Business", th: "ธุรกิจ" },
    examples: { en: "Selling goods, online stores, restaurants, services and any income not in the other categories.", th: "การขายสินค้า ร้านค้าออนไลน์ ร้านอาหาร งานบริการ และเงินได้ที่ไม่อยู่ในประเภทอื่น" },
    allowActual: true,
    typicalWithholding: 0.03,
    subtypes: BUSINESS_TYPES,
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<IncomeCategory, CategoryDef>

export function subtypeOf(item: IncomeItem): Subtype | undefined {
  const cat = CATEGORY_BY_ID[item.category]
  if (!cat.subtypes) return undefined
  return cat.subtypes.find((s) => s.key === item.subtype) ?? cat.subtypes[0]
}

/** Deemed or actual expense for items other than 40(1) and 40(2), which share their own limit. */
export function itemExpense(item: IncomeItem): { amount: number; method: "standard" | "actual" | "none"; rate: number | null } {
  const sub = subtypeOf(item)
  if (sub?.noExpense) return { amount: 0, method: "none", rate: 0 }
  const rate = sub?.rate ?? null
  const actualOnly = rate === null
  const method = actualOnly ? "actual" : item.expenseMethod ?? "standard"
  if (method === "actual") return { amount: Math.min(item.amount, Math.max(0, item.actualExpense ?? 0)), method, rate }
  if (item.category === "40_8" && sub?.key === "1") return { amount: performerExpense(item.amount), method, rate }
  return { amount: item.amount * (rate ?? 0), method, rate }
}
