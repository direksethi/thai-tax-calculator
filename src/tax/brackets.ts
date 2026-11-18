/** Personal income tax rates under section 48(1) of the Revenue Code. Unchanged since tax year 2560. */
export const PIT_BRACKETS = [
  { from: 0, to: 150_000, rate: 0 },
  { from: 150_000, to: 300_000, rate: 0.05 },
  { from: 300_000, to: 500_000, rate: 0.1 },
  { from: 500_000, to: 750_000, rate: 0.15 },
  { from: 750_000, to: 1_000_000, rate: 0.2 },
  { from: 1_000_000, to: 2_000_000, rate: 0.25 },
  { from: 2_000_000, to: 5_000_000, rate: 0.3 },
  { from: 5_000_000, to: Number.POSITIVE_INFINITY, rate: 0.35 },
] as const

export type BracketStep = { from: number; to: number; rate: number; taxable: number; tax: number }

export function progressiveSteps(net: number): BracketStep[] {
  const income = Math.max(0, net)
  return PIT_BRACKETS.map((b) => {
    const taxable = Math.max(0, Math.min(income, b.to) - b.from)
    return { from: b.from, to: b.to, rate: b.rate, taxable, tax: taxable * b.rate }
  })
}

export function progressiveTax(net: number): number {
  return round2(progressiveSteps(net).reduce((sum, s) => sum + s.tax, 0))
}

export function marginalRate(net: number): number {
  const income = Math.max(0, net)
  for (const b of PIT_BRACKETS) if (income < b.to) return b.rate
  return 0.35
}

/** Room left in the current bracket before the next rate applies. */
export function roomInBracket(net: number): number {
  const income = Math.max(0, net)
  for (const b of PIT_BRACKETS) if (income < b.to) return b.to - income
  return Number.POSITIVE_INFINITY
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
