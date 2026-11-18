import type { L } from "@/lib/i18n"
import { computePersonal, type PersonalResult, type PropertyInput, type SeveranceInput } from "@/tax/personal"
import type { PersonalInput } from "@/tax/types"
import { YEARS } from "@/tax/years"

export type Headroom = { id: string; label: L; room: number; saving: number }

type Input = PersonalInput & { severance?: SeveranceInput; property?: PropertyInput }

const CANDIDATES: { id: string; label: L; room: (r: PersonalResult, input: Input) => number }[] = [
  {
    id: "thaiEsg",
    label: { en: "Thai ESG fund", th: "กองทุน Thai ESG" },
    room: (r, i) => Math.min(r.limitBase * 0.3, YEARS[i.profile.year].thaiEsgMax) - (i.allowances.thaiEsg ?? 0),
  },
  {
    id: "rmf",
    label: { en: "RMF", th: "กองทุน RMF" },
    room: (r, i) => Math.min(r.limitBase * 0.3, 500_000 - r.allowances.retirementUsed + (i.allowances.rmf ?? 0)) - (i.allowances.rmf ?? 0),
  },
  {
    id: "life",
    label: { en: "Life insurance", th: "ประกันชีวิต" },
    room: (_r, i) => 100_000 - Math.min(i.allowances.health ?? 0, 25_000) - (i.allowances.life ?? 0),
  },
  {
    id: "health",
    label: { en: "Health insurance", th: "ประกันสุขภาพ" },
    room: (_r, i) => Math.min(25_000 - (i.allowances.health ?? 0), 100_000 - (i.allowances.life ?? 0) - (i.allowances.health ?? 0)),
  },
  {
    id: "annuity",
    label: { en: "Annuity life insurance", th: "ประกันชีวิตแบบบำนาญ" },
    room: (r, i) => Math.min(r.limitBase * 0.15, 200_000, 500_000 - r.allowances.retirementUsed) - Math.max(0, (i.allowances.annuity ?? 0) - 0),
  },
  {
    id: "parentHealth",
    label: { en: "Parents' health insurance", th: "ประกันสุขภาพบิดามารดา" },
    room: (_r, i) => 15_000 - (i.allowances.parentHealth ?? 0),
  },
]

/** Allowances with unused room, and the tax each would save if filled. */
export function headroom(input: Input, base: PersonalResult): Headroom[] {
  if (base.taxDue <= 0) return []
  const out: Headroom[] = []
  for (const c of CANDIDATES) {
    const room = Math.floor(Math.max(0, c.room(base, input)))
    if (room < 1_000) continue
    const next = computePersonal({ ...input, allowances: { ...input.allowances, [c.id]: (input.allowances[c.id] ?? 0) + room } })
    const saving = base.taxDue - next.taxDue
    if (saving >= 100) out.push({ id: c.id, label: c.label, room, saving })
  }
  return out.sort((a, b) => b.saving - a.saving)
}
