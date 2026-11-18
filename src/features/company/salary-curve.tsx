import { useMemo } from "react"
import { baht, type Lang } from "@/lib/i18n"
import type { CompanyComparison } from "@/tax/company"

const W = 400
const H = 170
const PAD = { l: 8, r: 8, t: 12, b: 22 }

function short(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`
  return String(Math.round(n))
}

/** Money reaching the owner at every salary level, against the best personal figure. */
export function SalaryCurve({ cmp, lang }: { cmp: CompanyComparison; lang: Lang }) {
  const personal = Math.max(cmp.standard.cash, cmp.actual?.cash ?? Number.NEGATIVE_INFINITY)
  const geo = useMemo(() => {
    const pts = cmp.curve
    if (pts.length < 2) return null
    const xs = pts.map((p) => p.salary)
    const ys = [...pts.map((p) => p.wealth), personal]
    const xMax = Math.max(...xs) || 1
    const yMin = Math.min(...ys)
    const yMax = Math.max(...ys)
    const span = Math.max(yMax - yMin, 1)
    const lo = yMin - span * 0.12
    const hi = yMax + span * 0.12
    const x = (v: number) => PAD.l + (v / xMax) * (W - PAD.l - PAD.r)
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b)
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.salary).toFixed(1)},${y(p.wealth).toFixed(1)}`).join(" ")
    return { x, y, path, xMax }
  }, [cmp.curve, personal])

  if (!geo) return null
  const opt = cmp.company
  const ox = geo.x(opt.salary)
  const oy = geo.y(opt.wealth)
  const py = geo.y(personal)

  return (
    <div className="sheet flex flex-col gap-3 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-[14px] font-medium">{lang === "en" ? "Salary you pay yourself" : "เงินเดือนที่จ่ายให้ตนเอง"}</h3>
        <span className="num text-[12px] text-muted-foreground">
          {lang === "en" ? "Best" : "เหมาะสมที่สุด"} {baht(opt.salary / 12)}/{lang === "en" ? "mo" : "เดือน"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={lang === "en" ? "Money kept at each salary level" : "เงินที่เหลือในแต่ละระดับเงินเดือน"}>
        <line x1={PAD.l} x2={W - PAD.r} y1={py} y2={py} className="stroke-muted-foreground/50" strokeDasharray="3 4" strokeWidth={1} />
        <text
          x={ox > W / 2 ? PAD.l : W - PAD.r}
          y={py > H - PAD.b - 14 ? py - 5 : py + 12}
          textAnchor={ox > W / 2 ? "start" : "end"}
          className="fill-muted-foreground text-[10px]"
        >
          {lang === "en" ? "Personal" : "บุคคล"} {baht(personal)}
        </text>
        <path d={geo.path} fill="none" className="stroke-ink" strokeWidth={1.75} strokeLinejoin="round" />
        <line x1={ox} x2={ox} y1={oy} y2={H - PAD.b} className="stroke-ink/30" strokeWidth={1} />
        <circle cx={ox} cy={oy} r={3.5} className="fill-ink" />
        <text x={Math.min(Math.max(ox, 40), W - 40)} y={Math.max(oy - 8, 10)} textAnchor="middle" className="fill-ink text-[10px] font-medium">
          {baht(opt.wealth)}
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={geo.x(geo.xMax * f)} y={H - 6} textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"} className="num fill-muted-foreground text-[10px]">
            {short(geo.xMax * f)}
          </text>
        ))}
      </svg>
      <p className="text-[12px] text-muted-foreground">
        {lang === "en" ? "Annual salary along the bottom; money you keep, including profit left in the company at 90%." : "แกนล่างคือเงินเดือนทั้งปี เส้นคือเงินที่คุณเหลือ รวมกำไรที่เก็บในบริษัทคิดที่ร้อยละ 90"}
      </p>
    </div>
  )
}
