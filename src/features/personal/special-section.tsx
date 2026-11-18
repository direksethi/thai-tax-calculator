import { CaretDownIcon } from "@phosphor-icons/react"
import { useState, type ReactNode } from "react"
import { CountInput, MoneyInput } from "@/components/tax/money-input"
import { Segmented } from "@/components/tax/segmented"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { baht, useLang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { PersonalResult, PropertyInput, SeveranceInput } from "@/tax/personal"

type Props = {
  severance: SeveranceInput
  property: PropertyInput
  pnd94Paid: number
  foreignTaxCredit: number
  result: PersonalResult
  onSeverance: (next: SeveranceInput) => void
  onProperty: (next: PropertyInput) => void
  onPnd94: (value: number) => void
  onForeign: (value: number) => void
}

export function SpecialSection(p: Props) {
  const lang = useLang()
  const s = p.severance
  const pr = p.property
  const sev = p.result.severance
  const prop = p.result.property
  return (
    <div className="sheet flex flex-col divide-y divide-border">
      <Panel
        title={lang === "en" ? "Severance and leaving payments" : "เงินได้กรณีออกจากงาน"}
        value={sev ? (sev.separate ? sev.tax : null) : null}
        active={s.statutory + s.other > 0}
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {lang === "en"
            ? "Statutory severance for being laid off is exempt up to the last 400 days of wages, at most 600,000 baht. The rest, with gratuities and the taxable part of a provident fund payout, can be taxed separately after 5 full years of service: 7,000 baht per year of service comes off, then half of the remainder, and there is no zero-rate first 150,000."
            : "ค่าชดเชยตามกฎหมายแรงงานกรณีถูกเลิกจ้างได้รับยกเว้นไม่เกินค่าจ้าง 400 วันสุดท้าย และไม่เกิน 600,000 บาท ส่วนที่เหลือรวมกับบำเหน็จและเงินจากกองทุนสำรองเลี้ยงชีพส่วนที่ต้องเสียภาษี เลือกแยกคำนวณได้เมื่อทำงานครบ 5 ปี หักค่าใช้จ่าย 7,000 บาทต่อปีที่ทำงาน แล้วหักอีกครึ่งหนึ่งของส่วนที่เหลือ และไม่ได้รับยกเว้น 150,000 บาทแรก"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Money id="sev-stat" label={lang === "en" ? "Statutory severance" : "ค่าชดเชยตามกฎหมายแรงงาน"} value={s.statutory} onChange={(v) => p.onSeverance({ ...s, statutory: v })} />
          <Money id="sev-400" label={lang === "en" ? "Wages for the last 400 days" : "ค่าจ้าง 400 วันสุดท้าย"} value={s.wages400Days} onChange={(v) => p.onSeverance({ ...s, wages400Days: v })} />
          <Money id="sev-other" label={lang === "en" ? "Gratuity, fund payout, other leaving pay" : "บำเหน็จ เงินกองทุน และเงินอื่นที่จ่ายเพราะออกจากงาน"} value={s.other} onChange={(v) => p.onSeverance({ ...s, other: v })} />
          <Money id="sev-wht" label={lang === "en" ? "Tax withheld on these payments" : "ภาษีที่ถูกหักจากเงินได้นี้"} value={s.withheld} onChange={(v) => p.onSeverance({ ...s, withheld: v })} />
          <Field className="flex-row items-center justify-between gap-4">
            <FieldLabel htmlFor="sev-years" className="text-[13px] font-normal">
              {lang === "en" ? "Full years of service" : "จำนวนปีที่ทำงาน"}
            </FieldLabel>
            <CountInput id="sev-years" value={s.years} max={60} onChange={(v) => p.onSeverance({ ...s, years: v })} />
          </Field>
          <label className="flex items-center justify-between gap-4">
            <span className="text-[13px]">{lang === "en" ? "Tax separately" : "แยกคำนวณภาษี"}</span>
            <Switch checked={s.separate} onCheckedChange={(v) => p.onSeverance({ ...s, separate: v })} />
          </label>
        </div>
        {sev ? (
          <Summary
            rows={[
              [lang === "en" ? "Exempt statutory severance" : "ค่าชดเชยที่ได้รับยกเว้น", sev.statutoryExempt],
              [lang === "en" ? "Taxable leaving pay" : "เงินได้ที่ต้องเสียภาษี", sev.income],
              ...(sev.separate
                ? ([
                    [lang === "en" ? "Expenses" : "ค่าใช้จ่าย", sev.expense],
                    [lang === "en" ? "Net, taxed separately" : "เงินได้สุทธิ แยกคำนวณ", sev.net],
                    [lang === "en" ? "Tax on severance" : "ภาษีจากเงินได้กรณีออกจากงาน", sev.tax],
                  ] as [string, number][])
                : ([[lang === "en" ? "Added to salary" : "รวมกับเงินเดือน", sev.income]] as [string, number][])),
            ]}
          />
        ) : null}
      </Panel>

      <Panel
        title={lang === "en" ? "Sale of inherited or personal real estate" : "การขายอสังหาริมทรัพย์ที่ได้มาโดยไม่ได้มุ่งค้ากำไร"}
        value={prop && prop.mode === "separate" ? prop.separateTax : null}
        active={pr.price > 0}
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {lang === "en"
            ? "The land office withholds tax on transfer. You can treat that as final, compute the tax separately to claim a refund, or add the sale to your other income. Inherited and gifted property takes a 50% expense. Bought property takes a deemed expense by years held (92% for one year down to 50% for eight or more) or actual cost. Separate tax cannot exceed 20% of the price."
            : "สำนักงานที่ดินหักภาษี ณ ที่จ่ายเมื่อโอน เลือกให้เป็นภาษีสุดท้าย แยกคำนวณเพื่อขอคืน หรือนำมารวมกับเงินได้อื่นก็ได้ ได้มาโดยมรดกหรือการให้หักค่าใช้จ่ายร้อยละ 50 ได้มาโดยวิธีอื่นหักเหมาตามจำนวนปีที่ถือครอง (ร้อยละ 92 สำหรับ 1 ปี ลดลงจนร้อยละ 50 สำหรับ 8 ปีขึ้นไป) หรือตามจริง ภาษีที่แยกคำนวณต้องไม่เกินร้อยละ 20 ของราคาขาย"}
        </p>
        <Segmented
          size="sm"
          value={pr.mode}
          onChange={(v) => p.onProperty({ ...pr, mode: v })}
          options={[
            { value: "final", label: lang === "en" ? "Final at land office" : "ถือเป็นภาษีสุดท้าย" },
            { value: "separate", label: lang === "en" ? "Compute separately" : "แยกคำนวณ" },
            { value: "combine", label: lang === "en" ? "Add to other income" : "รวมกับเงินได้อื่น" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Money id="pr-price" label={lang === "en" ? "Sale price or appraised value, whichever is higher" : "ราคาขายหรือราคาประเมิน แล้วแต่จำนวนใดสูงกว่า"} value={pr.price} onChange={(v) => p.onProperty({ ...pr, price: v })} />
          <Money id="pr-wht" label={lang === "en" ? "Tax withheld by the land office" : "ภาษีที่สำนักงานที่ดินหักไว้"} value={pr.withheld} onChange={(v) => p.onProperty({ ...pr, withheld: v })} />
          <Field className="flex-row items-center justify-between gap-4">
            <FieldLabel htmlFor="pr-years" className="text-[13px] font-normal">
              {lang === "en" ? "Years held" : "จำนวนปีที่ถือครอง"}
            </FieldLabel>
            <CountInput id="pr-years" value={pr.years} max={10} onChange={(v) => p.onProperty({ ...pr, years: Math.max(1, v) })} />
          </Field>
          <Segmented
            size="sm"
            value={pr.acquired}
            onChange={(v) => p.onProperty({ ...pr, acquired: v })}
            options={[
              { value: "inherited", label: lang === "en" ? "Inherited or gifted" : "มรดกหรือได้รับให้" },
              { value: "bought", label: lang === "en" ? "Bought" : "ซื้อมา" },
            ]}
          />
          {pr.acquired === "bought" ? (
            <>
              <label className="flex items-center justify-between gap-4">
                <span className="text-[13px]">{lang === "en" ? "Use actual cost" : "หักค่าใช้จ่ายตามจริง"}</span>
                <Switch checked={pr.useActual} onCheckedChange={(v) => p.onProperty({ ...pr, useActual: v })} />
              </label>
              {pr.useActual ? (
                <Money id="pr-cost" label={lang === "en" ? "Cost and transfer expenses" : "ต้นทุนและค่าใช้จ่ายในการโอน"} value={pr.actualCost} onChange={(v) => p.onProperty({ ...pr, actualCost: v })} />
              ) : null}
            </>
          ) : null}
        </div>
        {prop ? (
          <Summary
            rows={[
              [lang === "en" ? "Expense" : "ค่าใช้จ่าย", prop.expense],
              [lang === "en" ? "Income after expense" : "เงินได้หลังหักค่าใช้จ่าย", prop.net],
              [lang === "en" ? "Tax computed separately" : "ภาษีแยกคำนวณ", prop.separateTax],
              [lang === "en" ? "Withheld by the land office" : "ภาษีที่ถูกหักไว้", prop.withheld],
            ]}
          />
        ) : null}
      </Panel>

      <Panel title={lang === "en" ? "Tax already paid" : "ภาษีที่ชำระไว้แล้ว"} value={p.pnd94Paid + p.foreignTaxCredit > 0 ? p.pnd94Paid + p.foreignTaxCredit : null} active={p.pnd94Paid + p.foreignTaxCredit > 0}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Money id="pnd94" label={lang === "en" ? "Paid with the half-year PND 94" : "ภาษีที่ชำระตาม ภ.ง.ด.94"} value={p.pnd94Paid} onChange={p.onPnd94} />
          <Money id="ftc" label={lang === "en" ? "Foreign tax credit under a tax treaty" : "เครดิตภาษีต่างประเทศตามอนุสัญญาภาษีซ้อน"} value={p.foreignTaxCredit} onChange={p.onForeign} />
        </div>
      </Panel>
    </div>
  )
}

function Panel({ title, value, active, children }: { title: string; value: number | null; active: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-accent/40 sm:px-5">
        <span className={cn("flex-1 text-[14px]", active ? "font-medium" : "text-foreground/85")}>{title}</span>
        <span className={cn("num text-[14px]", value ? "font-medium text-ink" : "text-muted-foreground/50")}>{value ? baht(value) : "–"}</span>
        <CaretDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[panel-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] data-[ending-style]:h-0 data-[starting-style]:h-0">
        <div className="flex flex-col gap-4 px-4 pt-1 pb-5 sm:px-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Money({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className="text-[13px] font-normal">
        {label}
      </FieldLabel>
      <MoneyInput id={id} value={value} onChange={onChange} />
    </Field>
  )
}

function Summary({ rows }: { rows: [string, number][] }) {
  return (
    <dl className="flex flex-col gap-1.5 rounded-lg bg-muted/60 px-3.5 py-3 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="num font-medium">{baht(v)}</dd>
        </div>
      ))}
    </dl>
  )
}
