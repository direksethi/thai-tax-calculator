import { FormLine } from "@/components/tax/form-line"
import { baht, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import type { CompanyComparison } from "@/tax/company"
import { formRows, type PersonalResult } from "@/tax/personal"

/**
 * Every tax in each structure, who pays it, on which form, and the director's
 * own personal return line by line, beside the return they would file if
 * they earned the money personally.
 */
export function TaxByTax({ cmp, lang }: { cmp: CompanyComparison; lang: Lang }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const c = cmp.company
  const personal = cmp.actual && cmp.actual.cash > cmp.standard.cash ? cmp.actual : cmp.standard
  const hasRent = c.ownerResult.categories.some((x) => x.category === "40_5")
  const credit = c.ownerResult.dividendCredit
  const sso = c.sso.employee + c.sso.employer

  const rows: { label: string; who: string; amount: number; sub?: string }[] = [
    {
      label: t("Corporate income tax", "ภาษีเงินได้นิติบุคคล"),
      who: t("The company · PND 51 by 31 August, PND 50 within 150 days of year end", "บริษัท · ภ.ง.ด.51 ภายใน 31 สิงหาคม และ ภ.ง.ด.50 ภายใน 150 วันหลังปิดบัญชี"),
      amount: c.cit,
    },
    {
      label: hasRent ? t("Personal income tax on your salary and rent", "ภาษีเงินได้บุคคลธรรมดาจากเงินเดือนและค่าเช่า") : t("Personal income tax on your salary", "ภาษีเงินได้บุคคลธรรมดาจากเงินเดือน"),
      who: t("You · withheld monthly by the company on PND 1, settled on your annual return", "คุณ · บริษัทหัก ณ ที่จ่ายทุกเดือนตาม ภ.ง.ด.1 และสรุปในแบบประจำปี"),
      amount: c.payTax,
      sub: c.salary > 0 ? t(`About ${baht(c.salaryWithholding / 12)} a month withheld from ${baht(c.salary / 12)}`, `หักเดือนละประมาณ ${baht(c.salaryWithholding / 12)} จากเงินเดือน ${baht(c.salary / 12)}`) : undefined,
    },
  ]
  if (c.dividend > 0)
    rows.push({
      label: t("Tax on your dividend", "ภาษีเงินปันผล"),
      who: c.dividendIncluded
        ? t(`You · included in PND 90 with a ${baht(credit)} dividend credit; the 10% withheld on PND 2 is credited`, `คุณ · นำมารวมใน ภ.ง.ด.90 พร้อมเครดิตภาษีเงินปันผล ${baht(credit)} และภาษีร้อยละ 10 ที่หักตาม ภ.ง.ด.2 นำมาเครดิต`)
        : t("You · 10% withheld by the company on PND 2, as final tax", "คุณ · บริษัทหักร้อยละ 10 ตาม ภ.ง.ด.2 ถือเป็นภาษีสุดท้าย"),
      amount: c.dividendTax,
      sub: t(`On a dividend of ${baht(c.dividend)}`, `จากเงินปันผล ${baht(c.dividend)}`),
    })

  return (
    <section className="mt-16 flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{t("Tax by tax", "ภาษีแต่ละรายการ")}</h2>
        <p className="text-[14px] text-muted-foreground">
          {t("What each structure pays, who pays it, and the personal return you file in each case.", "ภาษีที่ต้องจ่ายในแต่ละรูปแบบ ใครเป็นผู้จ่าย และแบบภาษีบุคคลธรรมดาที่คุณต้องยื่นในแต่ละกรณี")}
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="sheet flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[15px] font-semibold">{t("Through the company", "ผ่านบริษัท")}</h3>
            <span className="num text-[13px] text-muted-foreground">
              {t("Salary", "เงินเดือน")} {baht(c.salary / 12)}/{t("mo", "เดือน")}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {rows.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-3">
                <span className="text-[14px] font-medium">{row.label}</span>
                <span className={cn("num text-right text-[14px] font-semibold", row.amount < 0 ? "text-leaf" : "")}>
                  {row.amount < 0 ? "−" : ""}
                  {baht(Math.abs(row.amount))}
                </span>
                <span className="col-span-2 text-[12.5px] leading-relaxed text-muted-foreground">{row.who}</span>
                {row.sub ? <span className="num col-span-2 text-[12.5px] text-muted-foreground">{row.sub}</span> : null}
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] gap-4 py-3">
              <span className="text-[14px] font-semibold">{t("Total tax", "ภาษีรวม")}</span>
              <span className="num text-right text-[15px] font-semibold text-ink">{baht(c.totalTax)}</span>
            </div>
            {sso > 0 ? (
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-3">
                <span className="text-[14px]">{t("Social security, not a tax", "เงินสมทบประกันสังคม ไม่ใช่ภาษี")}</span>
                <span className="num text-right text-[14px]">{baht(sso)}</span>
                <span className="col-span-2 text-[12.5px] text-muted-foreground">
                  {t(`You ${baht(c.sso.employee)} and the company ${baht(c.sso.employer)}, by the 15th of each month`, `คุณ ${baht(c.sso.employee)} และบริษัท ${baht(c.sso.employer)} นำส่งภายในวันที่ 15 ของทุกเดือน`)}
                </span>
              </div>
            ) : null}
          </div>
          <PersonalReturn
            title={t("Your personal return as director", "แบบภาษีบุคคลธรรมดาของคุณในฐานะกรรมการ")}
            r={c.ownerResult}
            lang={lang}
            note={t(
              "Tax withheld here is the monthly PND 1 withholding, plus 5% on any rent and the 10% on included dividends.",
              "ภาษีหัก ณ ที่จ่ายในแบบนี้คือภาษีที่หักทุกเดือนตาม ภ.ง.ด.1 รวมร้อยละ 5 จากค่าเช่า และร้อยละ 10 จากเงินปันผลที่นำมารวม",
            )}
          />
        </div>

        <div className="sheet flex flex-col gap-5 self-start p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-[15px] font-semibold">{t("Earned personally", "รับในนามบุคคล")}</h3>
            <span className="text-[13px] text-muted-foreground">
              {personal.kind === "actual" ? t("Actual expenses", "หักค่าใช้จ่ายตามจริง") : t("Standard expenses", "หักค่าใช้จ่ายแบบเหมา")}
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-3">
              <span className="text-[14px] font-medium">{t("Personal income tax", "ภาษีเงินได้บุคคลธรรมดา")}</span>
              <span className="num text-right text-[14px] font-semibold">{baht(personal.tax)}</span>
              <span className="col-span-2 text-[12.5px] leading-relaxed text-muted-foreground">
                {t(
                  "You · PND 90 by 31 March, after any 3% withheld by clients. Rent, professional and business income also needs a half-year PND 94 by 30 September.",
                  "คุณ · ภ.ง.ด.90 ภายใน 31 มีนาคม หักภาษีร้อยละ 3 ที่ลูกค้าหักไว้ เงินได้จากค่าเช่า วิชาชีพ และธุรกิจ ต้องยื่น ภ.ง.ด.94 ครึ่งปีภายใน 30 กันยายนด้วย",
                )}
              </span>
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 py-3">
              <span className="text-[14px] font-semibold">{t("Total tax", "ภาษีรวม")}</span>
              <span className="num text-right text-[15px] font-semibold">{baht(personal.tax)}</span>
            </div>
          </div>
          <PersonalReturn title={t("Your personal return", "แบบภาษีบุคคลธรรมดาของคุณ")} r={personal.result} lang={lang} />
        </div>
      </div>
    </section>
  )
}

function PersonalReturn({ title, r, lang, note }: { title: string; r: PersonalResult; lang: Lang; note?: string }) {
  const formName = r.form === "PND91" ? (lang === "en" ? "PND 91" : "ภ.ง.ด.91") : lang === "en" ? "PND 90" : "ภ.ง.ด.90"
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium">{title}</span>
        <span className="text-[12px] text-muted-foreground">{formName}</span>
      </div>
      {r.categories.map((c) => (
        <FormLine key={c.category} label={incomeLabel(c.category, lang)} value={c.gross} tone="muted" />
      ))}
      <div className="my-1 border-t border-border" />
      {formRows(r).map((row) => (
        <FormLine key={`${row.no}-${row.label.en}`} no={row.no} label={row.label[lang]} value={row.amount} tone={row.tone} />
      ))}
      {note ? <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  )
}

function incomeLabel(category: string, lang: Lang): string {
  const map: Record<string, [string, string]> = {
    "40_1": ["Salary, 40(1)", "เงินเดือน 40(1)"],
    "40_2": ["Fees, 40(2)", "ค่าจ้าง 40(2)"],
    "40_3": ["Royalties, 40(3)", "ค่าลิขสิทธิ์ 40(3)"],
    "40_4": ["Dividend with credit, 40(4)", "เงินปันผลรวมเครดิต 40(4)"],
    "40_5": ["Rent from the company, 40(5)", "ค่าเช่าจากบริษัท 40(5)"],
    "40_6": ["Professional fees, 40(6)", "วิชาชีพอิสระ 40(6)"],
    "40_7": ["Contracting, 40(7)", "รับเหมา 40(7)"],
    "40_8": ["Business income, 40(8)", "เงินได้จากธุรกิจ 40(8)"],
  }
  const pair = map[category] ?? [category, category]
  return lang === "en" ? pair[0] : pair[1]
}
