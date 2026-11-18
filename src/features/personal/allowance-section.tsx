import { CaretDownIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { CountInput, MoneyInput } from "@/components/tax/money-input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldLabel } from "@/components/ui/field"
import { baht, useLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ALLOWANCES, GROUPS, type AllowanceDef } from "@/tax/allowances"
import type { PersonalResult } from "@/tax/personal"
import type { AllowanceInputs, FilingStatus } from "@/tax/types"
import { YEARS } from "@/tax/years"
import type { TaxYear } from "@/tax/types"

export function AllowanceSection({
  year,
  status,
  inputs,
  onChange,
  result,
}: {
  year: TaxYear
  status: FilingStatus
  inputs: AllowanceInputs
  onChange: (next: AllowanceInputs) => void
  result: PersonalResult
}) {
  const lang = useLang()
  const cfg = YEARS[year]
  const allowedFor = (def: AllowanceDef) => {
    if (def.id === "donations") return result.donation2x + result.donation1x
    const ids = def.id === "life" ? ["life", "health", "spouseLife"] : def.id === "pvd" ? ["pvd"] : def.id === "flood" ? ["flood"] : [def.id]
    let total = result.allowances.rows.filter((r) => ids.includes(r.id)).reduce((s, r) => s + r.allowed, 0)
    if (def.id === "pvd") total += result.allowances.exemptFunds.pvd + result.allowances.exemptFunds.gpf + result.allowances.exemptFunds.teacher
    return total
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sheet flex flex-col divide-y divide-border">
        <FixedRow label={{ en: "Personal allowance", th: "ค่าลดหย่อนส่วนตัว" }} amount={60_000} lang={lang} />
        {status === "married_no_income" ? <FixedRow label={{ en: "Spouse with no income", th: "คู่สมรสที่ไม่มีเงินได้" }} amount={60_000} lang={lang} /> : null}
      </div>
      {GROUPS.map((group) => {
        const defs = ALLOWANCES.filter((d) => d.group === group.id && d.available(cfg, { status }))
        if (defs.length === 0) return null
        return (
          <div key={group.id} className="flex flex-col gap-2">
            <h3 className="px-1 text-[12.5px] font-medium text-muted-foreground">{group.label[lang]}</h3>
            <div className="sheet flex flex-col divide-y divide-border">
              {defs.map((def) => (
                <AllowanceRow key={def.id} def={def} inputs={inputs} onChange={onChange} lang={lang} allowed={allowedFor(def)} status={status} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FixedRow({ label, amount, lang }: { label: { en: string; th: string }; amount: number; lang: Lang }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
      <span className="text-[14px]">{label[lang]}</span>
      <span className="num text-[14px] font-medium text-ink">{baht(amount)}</span>
    </div>
  )
}

function AllowanceRow({
  def,
  inputs,
  onChange,
  lang,
  allowed,
  status,
}: {
  def: AllowanceDef
  inputs: AllowanceInputs
  onChange: (next: AllowanceInputs) => void
  lang: Lang
  allowed: number
  status: FilingStatus
}) {
  const entered = def.fields.some((f) => (inputs[f.key] ?? 0) > 0)
  const [open, setOpen] = useState(false)
  const fields = def.fields.filter((f) => f.key !== "spouseLife" || status === "married_no_income")

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40 sm:px-5">
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className={cn("text-[14px]", entered ? "font-medium" : "text-foreground/85")}>{def.label[lang]}</span>
          {def.pending ? (
            <Badge variant="outline" className="h-5 px-1.5 text-[10.5px] font-normal text-muted-foreground">
              {lang === "en" ? "Pending law" : "รอกฎหมาย"}
            </Badge>
          ) : null}
        </span>
        <span className={cn("num text-[14px]", allowed > 0 ? "font-medium text-ink" : "text-muted-foreground/50")}>{allowed > 0 ? baht(allowed) : "–"}</span>
        <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="flex flex-col gap-4 px-4 pt-1 pb-5 sm:px-5">
          <p className="max-w-prose text-[13px] leading-relaxed text-muted-foreground">{def.rule[lang]}</p>
          <div className={cn("grid gap-4", fields.length > 1 && "sm:grid-cols-2")}>
            {fields.map((f) => (
              <Field key={f.key} className={f.kind === "count" ? "flex-row items-center justify-between gap-4 sm:flex-col sm:items-start" : undefined}>
                <FieldLabel htmlFor={`al-${f.key}`} className="text-[13px] font-normal">
                  {f.label[lang]}
                </FieldLabel>
                {f.kind === "count" ? (
                  <CountInput id={`al-${f.key}`} value={inputs[f.key] ?? 0} max={f.max} onChange={(v) => onChange({ ...inputs, [f.key]: v })} />
                ) : (
                  <MoneyInput id={`al-${f.key}`} value={inputs[f.key] ?? 0} onChange={(v) => onChange({ ...inputs, [f.key]: v })} />
                )}
              </Field>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
