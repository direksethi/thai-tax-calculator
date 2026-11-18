import { InfoIcon } from "@phosphor-icons/react"
import { FormLine } from "@/components/tax/form-line"
import { Segmented } from "@/components/tax/segmented"
import { baht, percent, useLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { CATEGORY_BY_ID } from "@/tax/income"
import { formRows, type PersonalResult } from "@/tax/personal"
import { YEARS } from "@/tax/years"
import type { TaxYear } from "@/tax/types"
import type { Headroom } from "./headroom"
import { useState } from "react"

type View = "summary" | "form" | "rates"

export function Verdict({ r, year, compact = false }: { r: PersonalResult; year: TaxYear; compact?: boolean }) {
  const lang = useLang()
  const cfg = YEARS[year]
  const pay = r.balance > 0.5
  const refund = r.balance < -0.5
  const label = pay
    ? lang === "en" ? "Tax to pay" : "ภาษีที่ต้องชำระเพิ่ม"
    : refund
      ? lang === "en" ? "Refund due" : "ภาษีที่ได้รับคืน"
      : lang === "en" ? "No tax to pay" : "ไม่มีภาษีต้องชำระ"
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "num leading-none font-semibold tracking-[-0.03em]",
          compact ? "text-[26px]" : "text-[40px]",
          pay ? "text-stamp" : refund ? "text-leaf" : "text-foreground",
        )}
      >
        {baht(Math.abs(r.balance))}
        <span className={cn("ml-1.5 font-medium tracking-normal text-muted-foreground", compact ? "text-[13px]" : "text-[15px]")}>{lang === "en" ? "baht" : "บาท"}</span>
      </span>
      {!compact ? (
        <span className="mt-1.5 text-[13px] text-muted-foreground">
          {r.form === "PND91" ? (lang === "en" ? "File PND 91" : "ยื่นแบบ ภ.ง.ด.91") : lang === "en" ? "File PND 90" : "ยื่นแบบ ภ.ง.ด.90"}
          {" · "}
          {r.mustFile
            ? lang === "en"
              ? `by ${cfg.paperDeadline.en}, online by ${cfg.onlineDeadline.en}`
              : `ภายใน ${cfg.paperDeadline.th} ทางอินเทอร์เน็ตภายใน ${cfg.onlineDeadline.th}`
            : lang === "en"
              ? "not required at this income"
              : "ไม่ถึงเกณฑ์ที่ต้องยื่น"}
        </span>
      ) : null}
    </div>
  )
}

export function ResultPanel({ r, year, headroom }: { r: PersonalResult; year: TaxYear; headroom: Headroom[] }) {
  const lang = useLang()
  const [view, setView] = useState<View>("summary")
  return (
    <div className="flex flex-col gap-5">
      <div className="sheet flex flex-col gap-5 p-5 sm:p-6">
        <Verdict r={r} year={year} />
        <dl className="grid grid-cols-3 border-t border-border pt-4">
          <Stat label={lang === "en" ? "Net income" : "เงินได้สุทธิ"} value={baht(r.netIncome)} />
          <Stat label={lang === "en" ? "Tax for the year" : "ภาษีทั้งปี"} value={baht(r.taxDue + (r.severance?.separate ? r.severance.tax : 0) + (r.property?.mode === "separate" ? r.property.separateTax : 0))} />
          <Stat label={lang === "en" ? "Top rate" : "อัตราสูงสุด"} value={percent(r.marginalRate, 0)} sub={`${lang === "en" ? "Average" : "เฉลี่ย"} ${percent(r.effectiveRate, 1)}`} />
        </dl>
      </div>

      <div className="sheet flex flex-col gap-4 p-5 sm:p-6">
        <Segmented<View>
          size="sm"
          className="self-start"
          value={view}
          onChange={setView}
          options={[
            { value: "summary", label: lang === "en" ? "Summary" : "สรุป" },
            { value: "form", label: r.form === "PND91" ? (lang === "en" ? "PND 91" : "ภ.ง.ด.91") : lang === "en" ? "PND 90" : "ภ.ง.ด.90" },
            { value: "rates", label: lang === "en" ? "Rates" : "อัตราภาษี" },
          ]}
        />
        {view === "summary" ? <SummaryView r={r} lang={lang} /> : view === "form" ? <FormView r={r} lang={lang} year={year} /> : <RatesView r={r} lang={lang} />}
      </div>

      {headroom.length > 0 ? (
        <div className="sheet flex flex-col gap-3 p-5 sm:p-6">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-[14px] font-medium">{lang === "en" ? "Unused allowances" : "สิทธิลดหย่อนที่ยังใช้ไม่เต็ม"}</h3>
            <p className="text-[12.5px] text-muted-foreground">
              {lang === "en" ? `Each extra 1,000 baht of allowance saves up to ${baht(r.marginalRate * 1000)} baht.` : `ลดหย่อนเพิ่มทุก 1,000 บาท ประหยัดภาษีได้สูงสุด ${baht(r.marginalRate * 1000)} บาท`}
            </p>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {headroom.slice(0, 5).map((h) => (
              <div key={h.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-2.5 text-[13.5px]">
                <span>{h.label[lang]}</span>
                <span className="num text-right font-medium text-leaf">−{baht(h.saving)}</span>
                <span className="num text-[12px] text-muted-foreground">
                  {lang === "en" ? `Room ${baht(h.room)}` : `ใช้ได้อีก ${baht(h.room)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {r.warnings.length > 0 ? (
        <div className="flex flex-col gap-2.5 px-1">
          {r.warnings.map((w) => (
            <p key={w.en} className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
              {w[lang]}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-l border-border pl-3 first:border-l-0 first:pl-0">
      <dt className="truncate text-[11.5px] text-muted-foreground">{label}</dt>
      <dd className="num text-[15px] font-semibold tracking-[-0.01em]">{value}</dd>
      {sub ? <dd className="num text-[11.5px] text-muted-foreground">{sub}</dd> : null}
    </div>
  )
}

function SummaryView({ r, lang }: { r: PersonalResult; lang: Lang }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const expenses = r.categories.reduce((s, c) => s + c.expense, 0) + (r.property?.mode === "combine" ? r.property.expense : 0)
  const exempt = r.categories.reduce((s, c) => s + c.exempt, 0)
  return (
    <div className="flex flex-col">
      {r.categories.map((c) => (
        <FormLine
          key={c.category}
          no={CATEGORY_BY_ID[c.category].section}
          label={c.category === "40_1" && r.salaryBlock.fees > 0 ? t("Salary and fees", "เงินเดือนและค่าจ้าง") : CATEGORY_BY_ID[c.category].label[lang]}
          value={c.gross}
        />
      ))}
      {r.property?.mode === "combine" ? <FormLine no="40(8)" label={t("Property sale", "ขายอสังหาริมทรัพย์")} value={r.property.price} /> : null}
      {exempt > 0 ? <FormLine label={t("Less exempt income", "หัก เงินได้ที่ได้รับยกเว้น")} value={exempt} tone="minus" /> : null}
      <FormLine label={t("Less expenses", "หัก ค่าใช้จ่าย")} value={expenses} tone="minus" />
      <FormLine label={t("Less allowances", "หัก ค่าลดหย่อน")} value={r.allowances.total} tone="minus" />
      {r.donation2x + r.donation1x > 0 ? <FormLine label={t("Less donations", "หัก เงินบริจาค")} value={r.donation2x + r.donation1x} tone="minus" /> : null}
      <FormLine label={t("Net income", "เงินได้สุทธิ")} value={r.netIncome} tone="total" />
      <FormLine label={t("Tax on net income", "ภาษีจากเงินได้สุทธิ")} value={r.progressiveTax} />
      {r.minimumTax > 0 ? (
        <FormLine label={t("Minimum tax, 0.5% of non-salary income", "ภาษีขั้นต่ำ ร้อยละ 0.5")} value={r.minimumTax} tone="muted" sub={r.minimumTaxApplies ? t("Applies", "ใช้อัตรานี้") : t("Lower, does not apply", "ต่ำกว่า ไม่ใช้")} />
      ) : null}
      {r.severance?.separate ? <FormLine label={t("Tax on severance", "ภาษีกรณีออกจากงาน")} value={r.severance.tax} /> : null}
      {r.property?.mode === "separate" ? <FormLine label={t("Tax on property sale", "ภาษีขายอสังหาริมทรัพย์")} value={r.property.separateTax} /> : null}
      {r.foreignCredit > 0 ? <FormLine label={t("Less foreign tax credit", "หัก เครดิตภาษีต่างประเทศ")} value={r.foreignCredit} tone="minus" /> : null}
      <FormLine
        label={t("Less tax already paid", "หัก ภาษีที่ชำระไว้แล้ว")}
        value={r.withheld + r.dividendCredit + r.pnd94Paid + (r.severance?.separate ? r.severance.withheld : 0) + (r.property?.mode === "separate" ? r.property.withheld : 0)}
        tone="minus"
        sub={r.dividendCredit > 0 ? t(`Includes dividend credit ${baht(r.dividendCredit)}`, `รวมเครดิตภาษีเงินปันผล ${baht(r.dividendCredit)}`) : undefined}
      />
      <FormLine label={r.balance >= 0 ? t("Tax to pay", "ภาษีที่ต้องชำระเพิ่ม") : t("Refund", "ภาษีที่ได้รับคืน")} value={Math.abs(r.balance)} tone="total" />
      {r.finalWithholding > 0 ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          {t(`Final tax withheld on income left out of the return: ${baht(r.finalWithholding)} baht.`, `ภาษีหัก ณ ที่จ่ายที่ถือเป็นภาษีสุดท้ายของเงินได้ที่ไม่นำมารวม ${baht(r.finalWithholding)} บาท`)}
        </p>
      ) : null}
    </div>
  )
}

function FormView({ r, lang, year }: { r: PersonalResult; lang: Lang; year: TaxYear }) {
  const rows = formRows(r)
  const items = r.allowances.rows
  // Group the attachment rows by item number, the way the paper attachment lists them.
  const byItem = new Map<string, { labels: string[]; amount: number }>()
  for (const row of items) {
    const entry = byItem.get(row.item) ?? { labels: [], amount: 0 }
    entry.labels.push(row.label[lang])
    entry.amount += row.allowed
    byItem.set(row.item, entry)
  }
  const ordered = [...byItem.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        <p className="mb-1 text-[12px] font-medium text-muted-foreground">
          {r.form === "PND91" ? (lang === "en" ? "PND 91, section ก: tax calculation" : "ภ.ง.ด.91 ก. การคำนวณภาษี") : lang === "en" ? "PND 90, item 11: tax calculation" : "ภ.ง.ด.90 ข้อ 11 การคำนวณภาษี"}
        </p>
        {rows.map((row) => (
          <FormLine key={`${row.no}-${row.label.en}`} no={row.no} label={row.label[lang]} value={row.amount} tone={row.tone} />
        ))}
      </div>
      {r.form === "PND91" && r.salaryBlock.exemptFunds + r.salaryBlock.seniorExempt > 0 ? (
        <div className="flex flex-col">
          <p className="mb-1 text-[12px] font-medium text-muted-foreground">{lang === "en" ? "Section ข: exempt income" : "ข. รายการเงินได้ที่ได้รับยกเว้น"}</p>
          <FormLine no="1" label={lang === "en" ? "Provident fund over 10,000" : "เงินสะสมกองทุนสำรองเลี้ยงชีพ (ส่วนที่เกิน 10,000 บาท)"} value={r.allowances.exemptFunds.pvd} />
          <FormLine no="2" label={lang === "en" ? "Government Pension Fund" : "เงินสะสม กบข."} value={r.allowances.exemptFunds.gpf} />
          <FormLine no="3" label={lang === "en" ? "Private school teachers' fund" : "เงินสะสมกองทุนสงเคราะห์ครูโรงเรียนเอกชน"} value={r.allowances.exemptFunds.teacher} />
          <FormLine no="4" label={lang === "en" ? "Age 65 or over, or disabled" : "ผู้มีอายุตั้งแต่ 65 ปี หรือคนพิการ"} value={r.salaryBlock.seniorExempt} />
          <FormLine no="6" label={lang === "en" ? "Total, to section ก line 2" : "รวม ยกไปกรอกใน ก 2."} value={r.salaryBlock.exemptFunds + r.salaryBlock.seniorExempt} tone="total" />
        </div>
      ) : null}
      <div className="flex flex-col">
        <p className="mb-1 text-[12px] font-medium text-muted-foreground">
          {lang === "en" ? "Deductions attachment" : "ใบแนบรายการลดหย่อน"}
          {YEARS[year].provisional ? (lang === "en" ? ", numbered as in 2568" : " ลำดับตามแบบปี 2568") : ""}
        </p>
        {ordered.map(([item, e]) => (
          <FormLine key={item} no={item} label={e.labels.join(", ")} value={e.amount} />
        ))}
        <FormLine no="24" label={lang === "en" ? "Total, to the main form" : "รวม ยกไปแบบหลัก"} value={r.allowances.total} tone="total" />
      </div>
    </div>
  )
}

function RatesView({ r, lang }: { r: PersonalResult; lang: Lang }) {
  const top = Math.max(r.netIncome, 1)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-[4.5rem_1fr_4.5rem] gap-3 pb-1 text-[11.5px] text-muted-foreground">
        <span>{lang === "en" ? "Rate" : "อัตรา"}</span>
        <span>{lang === "en" ? "Net income band" : "ช่วงเงินได้สุทธิ"}</span>
        <span className="text-right">{lang === "en" ? "Tax" : "ภาษี"}</span>
      </div>
      {r.steps.map((s) => {
        const width = Number.isFinite(s.to) ? s.to - s.from : Math.max(top - s.from, 1)
        const fill = width > 0 ? Math.min(1, s.taxable / width) : 0
        const reached = s.taxable > 0
        return (
          <div key={s.from} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-[13px]">
            <span className={cn("num", reached ? "font-medium" : "text-muted-foreground/60")}>{s.rate === 0 ? (lang === "en" ? "Exempt" : "ยกเว้น") : percent(s.rate, 0)}</span>
            <span className="flex flex-col gap-1">
              <span className="relative h-1.5 overflow-hidden rounded-full bg-muted">
                <span className="absolute inset-y-0 left-0 rounded-full bg-ink transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${fill * 100}%` }} />
              </span>
              <span className="num text-[11.5px] text-muted-foreground">
                {baht(s.from)}
                {Number.isFinite(s.to) ? ` – ${baht(s.to)}` : "+"}
              </span>
            </span>
            <span className={cn("num text-right", reached ? "font-medium text-ink" : "text-muted-foreground/50")}>{reached ? baht(s.tax) : "–"}</span>
          </div>
        )
      })}
    </div>
  )
}
