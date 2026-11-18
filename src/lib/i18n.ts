import { useParams } from "@tanstack/react-router"
import type { L } from "@/tax/types"

export type Lang = "en" | "th"
export const LANGS: readonly Lang[] = ["en", "th"]

/** A string written in both languages. Every interface string is one of these. */
export type { L }

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "th"
}

export function useLang(): Lang {
  const params = useParams({ strict: false }) as { lang?: string }
  return isLang(params.lang) ? params.lang : "en"
}

export function pick(lang: Lang, text: L): string {
  return text[lang]
}

export function useT() {
  const lang = useLang()
  return (text: L) => text[lang]
}

const thb = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })
const thb2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Baht, rounded to whole baht, the way the forms print them. */
export function baht(value: number): string {
  const rounded = Math.round(value)
  return thb.format(Object.is(rounded, -0) ? 0 : rounded)
}

export function baht2(value: number): string {
  return thb2.format(value)
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`
}
