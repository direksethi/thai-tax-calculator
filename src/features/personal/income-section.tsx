import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { Choice } from "@/components/tax/choice"
import { MoneyInput } from "@/components/tax/money-input"
import { Segmented } from "@/components/tax/segmented"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { baht, percent, useLang, type Lang } from "@/lib/i18n"
import { CATEGORIES, CATEGORY_BY_ID, itemExpense, subtypeOf } from "@/tax/income"
import { canExclude, dividendCredit } from "@/tax/personal"
import type { IncomeItem } from "@/tax/types"
import { newIncome } from "./state"

const DIVIDEND_RATES = [
  { value: "0.2", en: "20%, standard rate", th: "ร้อยละ 20 อัตราปกติ" },
  { value: "0.15", en: "15%, SME middle band", th: "ร้อยละ 15 อัตรา SME" },
  { value: "0", en: "No credit: BOI-exempt or 0% band", th: "ไม่มีเครดิต: กิจการ BOI หรืออัตราร้อยละ 0" },
  { value: "0.1", en: "10%", th: "ร้อยละ 10" },
  { value: "0.25", en: "25%", th: "ร้อยละ 25" },
  { value: "0.3", en: "30%", th: "ร้อยละ 30" },
]

export function IncomeSection({ incomes, onChange }: { incomes: IncomeItem[]; onChange: (next: IncomeItem[]) => void }) {
  const lang = useLang()
  const update = (id: string, patch: Partial<IncomeItem>) => onChange(incomes.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  const remove = (id: string) => onChange(incomes.filter((i) => i.id !== id))

  return (
    <div className="flex flex-col gap-3">
      {incomes.map((item) => (
        <IncomeRow key={item.id} item={item} lang={lang} onChange={(patch) => update(item.id, patch)} onRemove={() => remove(item.id)} />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="self-start border-dashed bg-transparent" />}>
          <PlusIcon data-icon="inline-start" />
          {lang === "en" ? "Add income" : "เพิ่มเงินได้"}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuGroup>
            {CATEGORIES.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => onChange([...incomes, newIncome(c.id)])} className="flex-col items-start gap-0.5 py-2">
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span className="font-medium">{c.label[lang]}</span>
                  <span className="num text-[11.5px] text-muted-foreground">{c.section}</span>
                </span>
                <span className="text-[12px] leading-snug font-normal text-muted-foreground">{c.examples[lang]}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function IncomeRow({ item, lang, onChange, onRemove }: { item: IncomeItem; lang: Lang; onChange: (patch: Partial<IncomeItem>) => void; onRemove: () => void }) {
  const cat = CATEGORY_BY_ID[item.category]
  const sub = subtypeOf(item)
  const expense = itemExpense(item)
  const actualOnly = sub?.rate === null
  const showMethod = cat.allowActual && !sub?.noExpense && !actualOnly
  const isDividend = item.category === "40_4" && (item.subtype ?? "dividend") === "dividend"
  const excludable = canExclude(item)
  const credit = dividendCredit({ ...item, excluded: false })

  return (
    <div className="sheet flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[14px] font-medium">{cat.label[lang]}</span>
          <span className="num text-[12px] text-muted-foreground">
            {lang === "en" ? "Section" : "มาตรา"} {cat.section}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={lang === "en" ? "Remove income" : "ลบรายการ"} className="-mt-1 -mr-1 text-muted-foreground">
          <TrashIcon />
        </Button>
      </div>

      {cat.subtypes && cat.subtypes.length > 1 ? (
        <Field>
          <FieldLabel htmlFor={`${item.id}-sub`}>{lang === "en" ? "Type" : "ลักษณะเงินได้"}</FieldLabel>
          <Choice
            id={`${item.id}-sub`}
            value={sub?.key ?? ""}
            onChange={(v) => onChange({ subtype: v })}
            options={cat.subtypes.map((s) => ({
              value: s.key,
              label: `${s.label[lang]}${s.rate !== null && s.rate > 0 && !s.noExpense ? `  ·  ${percent(s.rate, 0)}` : ""}`,
            }))}
          />
          {sub?.hint ? <p className="text-[12px] leading-snug text-muted-foreground">{sub.hint[lang]}</p> : null}
        </Field>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${item.id}-amt`}>{lang === "en" ? "Amount received in the year" : "จำนวนเงินได้ทั้งปี"}</FieldLabel>
          <MoneyInput id={`${item.id}-amt`} value={item.amount} onChange={(v) => onChange({ amount: v })} />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${item.id}-wht`}>{lang === "en" ? "Tax withheld (50 Tawi)" : "ภาษีที่ถูกหัก ณ ที่จ่าย (50 ทวิ)"}</FieldLabel>
          <MoneyInput id={`${item.id}-wht`} value={item.withheld} onChange={(v) => onChange({ withheld: v })} />
        </Field>
      </div>

      {showMethod ? (
        <div className="flex flex-col gap-3">
          <Segmented
            size="sm"
            aria-label={lang === "en" ? "Expense method" : "วิธีหักค่าใช้จ่าย"}
            value={item.expenseMethod ?? "standard"}
            onChange={(v) => onChange({ expenseMethod: v })}
            options={[
              { value: "standard", label: lang === "en" ? `Standard ${percent(sub?.rate ?? 0, 0)}` : `หักเหมา ${percent(sub?.rate ?? 0, 0)}` },
              { value: "actual", label: lang === "en" ? "Actual expenses" : "หักตามจริง" },
            ]}
          />
          {item.expenseMethod === "actual" ? (
            <Field>
              <FieldLabel htmlFor={`${item.id}-act`}>{lang === "en" ? "Actual expenses with evidence" : "ค่าใช้จ่ายจริงที่มีหลักฐาน"}</FieldLabel>
              <MoneyInput id={`${item.id}-act`} value={item.actualExpense ?? 0} onChange={(v) => onChange({ actualExpense: v })} />
            </Field>
          ) : null}
        </div>
      ) : null}
      {actualOnly && cat.allowActual ? (
        <Field>
          <FieldLabel htmlFor={`${item.id}-act`}>{lang === "en" ? "Actual expenses with evidence" : "ค่าใช้จ่ายจริงที่มีหลักฐาน"}</FieldLabel>
          <MoneyInput id={`${item.id}-act`} value={item.actualExpense ?? 0} onChange={(v) => onChange({ actualExpense: v, expenseMethod: "actual" })} />
        </Field>
      ) : null}

      {isDividend ? (
        <Field>
          <FieldLabel htmlFor={`${item.id}-rate`}>{lang === "en" ? "Corporate tax rate on the paying company's profit" : "อัตราภาษีเงินได้นิติบุคคลของบริษัทผู้จ่าย"}</FieldLabel>
          <Choice
            id={`${item.id}-rate`}
            value={String(item.dividendRate ?? 0.2)}
            onChange={(v) => onChange({ dividendRate: Number(v) })}
            options={DIVIDEND_RATES.map((r) => ({ value: r.value, label: r[lang] }))}
          />
        </Field>
      ) : null}

      {excludable ? (
        <label className="flex items-start justify-between gap-4 rounded-lg bg-muted/60 px-3.5 py-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-[13.5px] font-medium">{lang === "en" ? "Include in the return" : "นำมารวมคำนวณภาษี"}</span>
            <span className="text-[12.5px] leading-snug text-muted-foreground">
              {item.excluded
                ? lang === "en"
                  ? `Left out. The ${item.subtype === "interest" ? "15%" : "10%"} withheld is the final tax.`
                  : `ไม่นำมารวม ภาษีร้อยละ ${item.subtype === "interest" ? "15" : "10"} ที่ถูกหักถือเป็นภาษีสุดท้าย`
                : isDividend && credit > 0
                  ? lang === "en"
                    ? `Included with a dividend credit of ${baht(credit)} baht.`
                    : `นำมารวม พร้อมเครดิตภาษีเงินปันผล ${baht(credit)} บาท`
                  : lang === "en"
                    ? "Included. The tax withheld is credited."
                    : "นำมารวม ภาษีที่ถูกหักนำมาเครดิตได้"}
            </span>
          </span>
          <Switch checked={!item.excluded} onCheckedChange={(checked) => onChange({ excluded: !checked })} className="mt-0.5" />
        </label>
      ) : null}

      {item.amount > 0 && !item.excluded && expense.method !== "none" && item.category !== "40_1" && item.category !== "40_2" ? (
        <p className="num text-[12.5px] text-muted-foreground">
          {lang === "en" ? "Expense deducted" : "หักค่าใช้จ่าย"} {baht(expense.amount)} {lang === "en" ? "baht" : "บาท"}
        </p>
      ) : null}
    </div>
  )
}
