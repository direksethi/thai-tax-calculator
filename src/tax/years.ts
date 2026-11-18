import type { L, TaxYear } from "./types"

export const RULES_AS_OF: L = { en: "4 November 2026", th: "4 พฤศจิกายน 2569" }

export type YearConfig = {
  year: TaxYear
  label: L
  /** When the return for this year is filed. */
  filing: L
  paperDeadline: L
  onlineDeadline: L
  socialSecurityMax: number
  thaiEsgMax: number
  cctv: boolean
  /** A year whose rules are projected from what is already law, not yet filed. */
  projected: boolean
  easyEReceipt: boolean
  domesticTravel: boolean
  thaiEsgxNew: boolean
  /** Maximum LTF-to-Thai ESGX switch amount deductible this year. */
  thaiEsgxLtfMax: number
  homeConstruction: boolean
  art: boolean
  solarRooftop: boolean
  energyLabel: boolean
  floodRelief: boolean
  /** Donations to charities count only through e-Donation from 2569. */
  eDonationOnly: boolean
  /** The 2569 attachment has not been published; item numbers follow 2568. */
  provisional: boolean
}

export const YEARS: Record<TaxYear, YearConfig> = {
  2568: {
    year: 2568,
    label: { en: "2025 (B.E. 2568)", th: "ปีภาษี 2568" },
    filing: { en: "Filed January to April 2026", th: "ยื่นแบบมกราคมถึงเมษายน 2569" },
    paperDeadline: { en: "31 March 2026", th: "31 มีนาคม 2569" },
    onlineDeadline: { en: "8 April 2026", th: "8 เมษายน 2569" },
    socialSecurityMax: 9_000,
    thaiEsgMax: 300_000,
    cctv: true,
    projected: false,
    easyEReceipt: true,
    domesticTravel: true,
    thaiEsgxNew: true,
    thaiEsgxLtfMax: 300_000,
    homeConstruction: true,
    art: true,
    solarRooftop: false,
    energyLabel: false,
    floodRelief: false,
    eDonationOnly: false,
    provisional: false,
  },
  2569: {
    year: 2569,
    label: { en: "2026 (B.E. 2569)", th: "ปีภาษี 2569" },
    filing: { en: "Filed January to April 2027", th: "ยื่นแบบมกราคมถึงเมษายน 2570" },
    paperDeadline: { en: "31 March 2027", th: "31 มีนาคม 2570" },
    onlineDeadline: { en: "8 April 2027, if the online extension is renewed", th: "8 เมษายน 2570 หากมีการขยายเวลายื่นออนไลน์" },
    socialSecurityMax: 10_500,
    thaiEsgMax: 300_000,
    cctv: true,
    projected: false,
    easyEReceipt: false,
    domesticTravel: false,
    thaiEsgxNew: false,
    thaiEsgxLtfMax: 50_000,
    homeConstruction: true,
    art: true,
    solarRooftop: true,
    energyLabel: true,
    floodRelief: true,
    eDonationOnly: true,
    provisional: true,
  },
  2570: {
    year: 2570,
    label: { en: "2027 (B.E. 2570)", th: "ปีภาษี 2570" },
    filing: { en: "Projected, filed January to April 2028", th: "ประมาณการ ยื่นแบบมกราคมถึงเมษายน 2571" },
    paperDeadline: { en: "31 March 2028", th: "31 มีนาคม 2571" },
    onlineDeadline: { en: "8 April 2028, if the online extension is renewed", th: "8 เมษายน 2571 หากมีการขยายเวลายื่นออนไลน์" },
    socialSecurityMax: 10_500,
    thaiEsgMax: 100_000,
    cctv: false,
    projected: true,
    easyEReceipt: false,
    domesticTravel: false,
    thaiEsgxNew: false,
    thaiEsgxLtfMax: 50_000,
    homeConstruction: false,
    art: true,
    solarRooftop: true,
    energyLabel: true,
    floodRelief: false,
    eDonationOnly: true,
    provisional: true,
  },
}

export const CURRENT_YEAR: TaxYear = 2569
export const ALL_YEARS: TaxYear[] = [2570, 2569, 2568]

/** The year after, if the calculator knows its rules. */
export function nextYear(year: TaxYear): TaxYear | null {
  return year === 2568 ? 2569 : year === 2569 ? 2570 : null
}
