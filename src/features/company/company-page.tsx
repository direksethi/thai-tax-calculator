import { ArrowSquareOutIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, type ReactNode } from "react"
import { SaveBar } from "@/features/account/save-bar"
import { useAccountsEnabled } from "@/lib/accounts"
import { getReturn } from "@/server/returns"
import { PageHeader } from "@/components/site/page-header"
import { Choice } from "@/components/tax/choice"
import { CountInput, MoneyInput } from "@/components/tax/money-input"
import { Segmented } from "@/components/tax/segmented"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { baht, percent, useLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { BUSINESS_TYPES } from "@/tax/business-types"
import { compareStructures, unregisteredPartnership, type AssetKind, type CompanyComparison } from "@/tax/company"
import type { TaxYear } from "@/tax/types"
import { ALL_YEARS, YEARS } from "@/tax/years"
import { SalaryCurve } from "./salary-curve"
import { TaxByTax } from "./tax-by-tax"
import { initialCompany, useCompanyState, type CompanyState } from "./state"

function incomeOptions(lang: Lang) {
  return [
    { value: "40_2:", label: lang === "en" ? "Freelance services and fees · 40(2) · 50% up to 100,000" : "รับจ้างทำงาน ค่าบริการ ค่าธรรมเนียม · 40(2) · ร้อยละ 50 ไม่เกิน 100,000" },
    { value: "40_6:other", label: lang === "en" ? "Law, engineering, architecture, accounting · 40(6) · 30%" : "กฎหมาย วิศวกรรม สถาปัตยกรรม บัญชี · 40(6) · ร้อยละ 30" },
    { value: "40_6:medical", label: lang === "en" ? "Medicine · 40(6) · 60%" : "การประกอบโรคศิลปะ · 40(6) · ร้อยละ 60" },
    { value: "40_6:fineArts", label: lang === "en" ? "Fine arts · 40(6) · 60%" : "ประณีตศิลปกรรม · 40(6) · ร้อยละ 60" },
    { value: "40_7:contract", label: lang === "en" ? "Contracting with materials · 40(7) · 60%" : "รับเหมาที่จัดหาสัมภาระ · 40(7) · ร้อยละ 60" },
    ...BUSINESS_TYPES.map((b) => ({
      value: `40_8:${b.key}`,
      label: `${b.label[lang]} · 40(8) · ${b.rate === null ? (lang === "en" ? "actual" : "ตามจริง") : percent(b.rate, 0)}`,
    })),
  ]
}

const ASSET_KINDS: { value: AssetKind; en: string; th: string }[] = [
  { value: "computer", en: "Computer or software, 3 years", th: "คอมพิวเตอร์หรือซอฟต์แวร์ 3 ปี" },
  { value: "car", en: "Passenger car, 20% a year on up to 1,000,000", th: "รถยนต์นั่ง ร้อยละ 20 ต่อปี ไม่เกิน 1,000,000" },
  { value: "equipment", en: "Equipment, 20% a year", th: "อุปกรณ์ ร้อยละ 20 ต่อปี" },
  { value: "furniture", en: "Furniture, 20% a year", th: "เครื่องตกแต่ง ร้อยละ 20 ต่อปี" },
]

export function CompanyPage() {
  const lang = useLang()
  const [s, setS] = useCompanyState()
  const set = (patch: Partial<CompanyState>) => setS((prev) => ({ ...prev, ...patch }))
  const cmp = useMemo(() => compareStructures(s), [s])
  const partnership = useMemo(() => unregisteredPartnership(s, s.partners), [s])
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const search = useSearch({ strict: false }) as { return?: string }
  const navigate = useNavigate()
  const accounts = useAccountsEnabled()

  useEffect(() => {
    const id = search.return
    if (!accounts || !id || id === s.savedId) return
    let cancelled = false
    void getReturn({ data: { id } }).then((row) => {
      if (cancelled || !row || row.kind !== "company") return
      setS({ ...initialCompany(), ...(JSON.parse(row.dataJson) as Partial<CompanyState>), savedId: row.id, name: row.name })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.return])

  const { savedId, name, ...data } = s
  const best = cmp.actual && cmp.actual.cash > cmp.standard.cash ? cmp.actual : cmp.standard

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <PageHeader
        eyebrow={t("Structure comparison", "เปรียบเทียบรูปแบบ")}
        title={t("Company or personal", "จดบริษัท หรือรับเงินในนามบุคคล")}
        description={t(
          "The same work earned as a person, or run through a company that pays you a salary and dividends. Every figure includes the company's tax, its running costs and the tax on what reaches you.",
          "งานเดียวกันเมื่อรับเงินในนามบุคคล เทียบกับดำเนินการผ่านบริษัทที่จ่ายเงินเดือนและเงินปันผลให้คุณ ตัวเลขรวมภาษีนิติบุคคล ค่าใช้จ่ายในการดูแลบริษัท และภาษีของเงินที่ถึงมือคุณ",
        )}
        aside={
          <Segmented<string>
            aria-label={t("Tax year", "ปีภาษี")}
            value={String(s.year)}
            onChange={(v) => set({ year: Number(v) as TaxYear })}
            options={ALL_YEARS.map((y) => ({ value: String(y), label: YEARS[y].label[lang] }))}
          />
        }
      />

      <SaveBar
        kind="company"
        year={s.year}
        data={data}
        summary={{ tax: cmp.company.wealth > best.cash ? cmp.company.totalTax : best.tax, income: s.revenue }}
        savedId={savedId}
        name={name}
        defaultName={t(`${s.year} company comparison`, `เปรียบเทียบบริษัทปี ${s.year}`)}
        onSaved={(id, n) => {
          setS((prev) => ({ ...prev, savedId: id, name: n }))
          void navigate({ to: "/$lang/company", params: { lang }, search: { return: id }, replace: true })
        }}
        onRename={(n) => set({ name: n })}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-12">
          <Section no="1" title={t("The work", "ลักษณะงาน")}>
            <div className="sheet flex flex-col gap-5 p-4 sm:p-5">
              <Field>
                <FieldLabel htmlFor="c-type">{t("Type of income if earned personally", "ประเภทเงินได้หากรับในนามบุคคล")}</FieldLabel>
                <Choice
                  id="c-type"
                  value={`${s.personal.category}:${s.personal.subtype ?? ""}`}
                  onChange={(v) => {
                    const [category, subtype] = v.split(":")
                    set({ personal: { category: category as CompanyState["personal"]["category"], subtype: subtype || undefined } })
                  }}
                  options={incomeOptions(lang)}
                />
                {s.personal.category === "40_2" ? (
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                    {t(
                      "Most freelance service work without materials falls under 40(2), sharing one 100,000 baht expense limit with salary. Selling goods and running a trade falls under 40(8).",
                      "งานบริการฟรีแลนซ์ส่วนใหญ่ที่ไม่ได้จัดหาสัมภาระเป็นเงินได้ตามมาตรา 40(2) ใช้วงเงินค่าใช้จ่าย 100,000 บาทร่วมกับเงินเดือน การขายสินค้าและประกอบการค้าเป็นเงินได้ตามมาตรา 40(8)",
                    )}
                  </p>
                ) : null}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Money id="c-rev" label={t("Revenue for the year", "รายได้ทั้งปี")} value={s.revenue} onChange={(v) => set({ revenue: v })} />
                <Money id="c-cost" label={t("Business costs: contractors, stock, ads", "ต้นทุนธุรกิจ เช่น ผู้รับจ้าง สินค้า โฆษณา")} value={s.businessCosts} onChange={(v) => set({ businessCosts: v })} />
                <Money
                  id="c-shared"
                  label={t("Costs you pay either way: phone, internet, software, travel", "ค่าใช้จ่ายที่จ่ายอยู่แล้ว เช่น โทรศัพท์ อินเทอร์เน็ต ซอฟต์แวร์ เดินทาง")}
                  value={s.sharedCosts}
                  onChange={(v) => set({ sharedCosts: v })}
                />
                <Money id="c-allow" label={t("Your allowances beyond the 60,000 personal", "ค่าลดหย่อนอื่นนอกจากส่วนตัว 60,000 บาท")} value={s.otherAllowances} onChange={(v) => set({ otherAllowances: v })} />
              </div>
            </div>
          </Section>

          <Section no="2" title={t("The company", "บริษัท")}>
            <div className="sheet flex flex-col gap-5 p-4 sm:p-5">
              <Segmented<CompanyState["entity"]>
                value={s.entity}
                onChange={(v) => set({ entity: v, audit: v === "company" ? 15_000 : 8_000 })}
                options={[
                  { value: "company", label: t("Limited company", "บริษัทจำกัด") },
                  { value: "partnership", label: t("Limited partnership", "ห้างหุ้นส่วนจำกัด") },
                ]}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Money id="c-cap" label={t("Registered capital", "ทุนจดทะเบียน")} value={s.registeredCapital} onChange={(v) => set({ registeredCapital: v })} />
                <Toggle
                  label={t("SME rates: capital and revenue never above 5M and 30M", "อัตรา SME: ทุนไม่เคยเกิน 5 ล้านและรายได้ไม่เคยเกิน 30 ล้าน")}
                  checked={s.sme && s.registeredCapital <= 5_000_000}
                  onChange={(v) => set({ sme: v })}
                />
                <Field className="sm:col-span-2">
                  <FieldLabel>{t("Accountant", "ผู้ทำบัญชี")}</FieldLabel>
                  <Segmented<CompanyState["accountingMode"]>
                    size="sm"
                    value={s.accountingMode}
                    onChange={(v) => set({ accountingMode: v })}
                    options={[
                      { value: "package", label: t("One yearly fee for everything", "ค่าบริการรายปีรวมทุกอย่าง") },
                      { value: "itemized", label: t("Bookkeeping and audit separately", "ค่าทำบัญชีและค่าสอบบัญชีแยกกัน") },
                    ]}
                  />
                </Field>
                {s.accountingMode === "package" ? (
                  <Money
                    id="c-acct"
                    label={t("Accountant, all-in per year", "ค่าบริการผู้ทำบัญชีรวมต่อปี")}
                    value={s.accountingPackage}
                    onChange={(v) => set({ accountingPackage: v })}
                  />
                ) : (
                  <>
                    <Money id="c-book" label={t("Bookkeeping per month", "ค่าทำบัญชีต่อเดือน")} value={s.bookkeepingMonthly} onChange={(v) => set({ bookkeepingMonthly: v })} />
                    <Money
                      id="c-audit"
                      label={s.entity === "company" ? t("Audit by a CPA per year", "ค่าสอบบัญชีโดย CPA ต่อปี") : t("Audit by a tax auditor (TA) per year", "ค่าสอบบัญชีโดย TA ต่อปี")}
                      value={s.audit}
                      onChange={(v) => set({ audit: v })}
                    />
                  </>
                )}
                <Money id="c-misc" label={t("Bank, certificates, stamp duty per year", "ค่าธนาคาร หนังสือรับรอง อากรแสตมป์ต่อปี")} value={s.misc} onChange={(v) => set({ misc: v })} />
                <Toggle label={t("Include registration fees this year", "รวมค่าจดทะเบียนในปีนี้")} checked={s.includeFormation} onChange={(v) => set({ includeFormation: v })} />
              </div>
              <Field>
                <FieldLabel>{t("Profit paid out as dividends", "สัดส่วนกำไรที่จ่ายเป็นเงินปันผล")}</FieldLabel>
                <Segmented<string>
                  size="sm"
                  value={String(s.distribution)}
                  onChange={(v) => set({ distribution: Number(v) })}
                  options={["1", "0.75", "0.5", "0"].map((v) => ({ value: v, label: percent(Number(v), 0) }))}
                />
              </Field>
            </div>
          </Section>

          <Section no="3" title={t("Your pay", "ค่าตอบแทนของคุณ")}>
            <div className="sheet flex flex-col gap-5 p-4 sm:p-5">
              <Segmented<CompanyState["salaryMode"]>
                value={s.salaryMode}
                onChange={(v) => set({ salaryMode: v })}
                options={[
                  { value: "optimize", label: t("Find the best salary", "หาเงินเดือนที่เหมาะสมที่สุด") },
                  { value: "fixed", label: t("Set a salary", "กำหนดเงินเดือนเอง") },
                ]}
              />
              {s.salaryMode === "fixed" ? (
                <Money id="c-sal" label={t("Monthly salary", "เงินเดือนต่อเดือน")} value={s.monthlySalary} onChange={(v) => set({ monthlySalary: v })} />
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Toggle label={t("Register yourself for social security", "ขึ้นทะเบียนประกันสังคมให้ตนเอง")} checked={s.ownerInSso} onChange={(v) => set({ ownerInSso: v })} />
                <Field>
                  <FieldLabel className="text-[13px] font-normal">{t("Provident fund, each side", "กองทุนสำรองเลี้ยงชีพ ฝ่ายละ")}</FieldLabel>
                  <Segmented<string>
                    size="sm"
                    value={String(s.pvdRate)}
                    onChange={(v) => set({ pvdRate: Number(v) })}
                    options={["0", "0.05", "0.1", "0.15"].map((v) => ({ value: v, label: percent(Number(v), 0) }))}
                  />
                </Field>
              </div>
              {s.ownerInSso ? (
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {t(
                    "The Social Security Office may treat a founding shareholder as an employer rather than an employee. Contributions are accepted at registration but benefits can be refused at claim time.",
                    "สำนักงานประกันสังคมอาจถือว่าผู้ก่อตั้งที่ถือหุ้นเป็นนายจ้าง ไม่ใช่ลูกจ้าง แม้รับขึ้นทะเบียนได้ แต่อาจถูกปฏิเสธสิทธิประโยชน์เมื่อยื่นขอรับ",
                  )}
                </p>
              ) : null}
              {s.pvdRate > 0 ? (
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {t(
                    "The company's contribution is a deductible expense and is not taxed as your income when paid in. Your contribution is an allowance. Small companies join a pooled fund run by an asset manager.",
                    "เงินสมทบของบริษัทเป็นรายจ่ายที่หักได้ และไม่ถือเป็นเงินได้ของคุณเมื่อนำส่ง เงินสะสมของคุณใช้เป็นค่าลดหย่อน บริษัทขนาดเล็กเข้าร่วมกองทุนแบบรวมของบริษัทจัดการได้",
                  )}
                </p>
              ) : null}
            </div>
          </Section>

          <Section no="4" title={t("Moving costs into the company", "ย้ายค่าใช้จ่ายเข้าบริษัท")}>
            <div className="sheet flex flex-col gap-5 p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Money id="c-home" label={t("Home office rent paid to you, per month", "ค่าเช่าสำนักงานในบ้านที่จ่ายให้คุณ ต่อเดือน")} value={s.homeOfficeRent} onChange={(v) => set({ homeOfficeRent: v })} />
                <Money id="c-car" label={t("Car rent paid to you, per month", "ค่าเช่ารถที่จ่ายให้คุณ ต่อเดือน")} value={s.carRent} onChange={(v) => set({ carRent: v })} />
                <Money id="c-2x" label={t("Training, e-Tax and SME digital spend, deducted twice", "ค่าอบรม ระบบ e-Tax และดิจิทัล SME หักได้ 2 เท่า")} value={s.doubleDeduction} onChange={(v) => set({ doubleDeduction: v })} />
                <Money id="c-ent" label={t("Client entertainment", "ค่ารับรองลูกค้า")} value={s.entertainment} onChange={(v) => set({ entertainment: v })} />
              </div>
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                {t(
                  "Rent you receive is your 40(5) income with a 30% standard expense, and the company withholds 5%. Car rent is deductible up to 36,000 a month. Entertainment is capped at 0.3% of revenue or capital. The 2x for SME digital spend covers the first 300,000.",
                  "ค่าเช่าที่คุณได้รับเป็นเงินได้ตามมาตรา 40(5) หักค่าใช้จ่ายร้อยละ 30 และบริษัทหักภาษี ณ ที่จ่ายร้อยละ 5 ค่าเช่ารถหักได้ไม่เกินเดือนละ 36,000 บาท ค่ารับรองไม่เกินร้อยละ 0.3 ของรายได้หรือทุน การหัก 2 เท่าสำหรับดิจิทัล SME ใช้กับ 300,000 บาทแรก",
                )}
              </p>
              <div className="flex flex-col gap-3">
                <span className="text-[13.5px] font-medium">{t("Personal assets sold to the company", "ทรัพย์สินส่วนตัวที่ขายให้บริษัท")}</span>
                {s.assets.map((a) => (
                  <div key={a.id} className="grid grid-cols-[1fr_9rem_auto] items-center gap-2">
                    <Choice
                      value={a.kind}
                      onChange={(v) => set({ assets: s.assets.map((x) => (x.id === a.id ? { ...x, kind: v as AssetKind } : x)) })}
                      options={ASSET_KINDS.map((k) => ({ value: k.value, label: k[lang] }))}
                    />
                    <MoneyInput value={a.price} onChange={(v) => set({ assets: s.assets.map((x) => (x.id === a.id ? { ...x, price: v } : x)) })} aria-label={t("Price", "ราคา")} />
                    <Button variant="ghost" size="icon-sm" onClick={() => set({ assets: s.assets.filter((x) => x.id !== a.id) })} aria-label={t("Remove asset", "ลบรายการ")}>
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="self-start border-dashed bg-transparent"
                  onClick={() => set({ assets: [...s.assets, { id: `a${Date.now()}`, kind: "computer", label: "", price: 60_000 }] })}
                >
                  <PlusIcon data-icon="inline-start" />
                  {t("Add asset", "เพิ่มทรัพย์สิน")}
                </Button>
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {t(
                    "Selling a personal computer, phone or car you did not buy to trade is exempt for you under section 42(9). The company depreciates it at a market price. The money you receive replaces the asset, so it is not counted as a gain below.",
                    "การขายคอมพิวเตอร์ โทรศัพท์ หรือรถยนต์ส่วนตัวที่ไม่ได้ซื้อมาเพื่อค้า ได้รับยกเว้นภาษีตามมาตรา 42(9) บริษัทหักค่าเสื่อมราคาตามราคาตลาด เงินที่ได้รับเป็นการแลกกับทรัพย์สิน จึงไม่นับเป็นกำไรในการเปรียบเทียบ",
                  )}
                </p>
              </div>
            </div>
          </Section>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setS(initialCompany())
                void navigate({ to: "/$lang/company", params: { lang }, search: {}, replace: true })
              }}
            >
              {t("Reset to the example", "กลับไปใช้ตัวอย่าง")}
            </Button>
          </div>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
          <Comparison cmp={cmp} lang={lang} />
          <SalaryCurve cmp={cmp} lang={lang} />
          <CompanyBreakdown cmp={cmp} lang={lang} s={s} />
        </aside>
      </div>

      <TaxByTax cmp={cmp} lang={lang} />

      <div className="mt-16 grid gap-5 lg:grid-cols-2">
        <Obligations lang={lang} vat={cmp.vatRequired} />
        <div className="sheet flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-[15px] font-semibold">{t("Unregistered partnership", "ห้างหุ้นส่วนสามัญที่ไม่จดทะเบียน")}</h3>
            <CountInput value={s.partners} onChange={(v) => set({ partners: Math.max(2, v) })} max={20} aria-label={t("Partners", "จำนวนหุ้นส่วน")} />
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {t(
              `Taxed once as a single person with 60,000 allowance per partner, capped at 120,000. Since 2558 each partner's share is taxed again as 40(8) income with no expense and no credit.`,
              `เสียภาษีในนามห้างเหมือนบุคคลหนึ่งคน ลดหย่อนคนละ 60,000 บาท รวมไม่เกิน 120,000 บาท ตั้งแต่ปี 2558 ส่วนแบ่งกำไรของหุ้นส่วนแต่ละคนต้องเสียภาษีอีกครั้งเป็นเงินได้ตามมาตรา 40(8) โดยไม่มีค่าใช้จ่ายและไม่มีเครดิตภาษี`,
            )}
          </p>
          <dl className="flex flex-col gap-1.5 text-[13.5px]">
            <Row k={t("Tax paid by the partnership", "ภาษีในนามห้าง")} v={partnership.entityTax} />
            <Row k={t(`Tax on ${partnership.partners} partners' shares`, `ภาษีของหุ้นส่วน ${partnership.partners} คน`)} v={partnership.partnerTaxEach * partnership.partners} />
            <Row k={t("Total", "รวม")} v={partnership.total} strong />
            <Row k={t("If each partner earned their share personally", "หากหุ้นส่วนแต่ละคนรับเงินในนามตนเอง")} v={partnership.separatelyTotal} muted />
          </dl>
        </div>
      </div>
    </div>
  )
}

function Comparison({ cmp, lang }: { cmp: CompanyComparison; lang: Lang }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const bestPersonal = cmp.actual && cmp.actual.cash > cmp.standard.cash ? cmp.actual : cmp.standard
  const companyKeep = cmp.company.wealth
  const diff = companyKeep - bestPersonal.cash
  // The headline is total tax: the lowest personal figure against everything the company route pays.
  const personalTax = Math.min(cmp.standard.tax, cmp.actual?.tax ?? Number.POSITIVE_INFINITY)
  const taxSaved = personalTax - cmp.company.totalTax
  const companyLessTax = taxSaved > 0
  const cols = [
    { key: "std", title: t("Personal, standard", "บุคคล หักเหมา"), tax: cmp.standard.tax, other: 0, keep: cmp.standard.cash, inCo: 0 },
    ...(cmp.actual ? [{ key: "act", title: t("Personal, actual", "บุคคล หักตามจริง"), tax: cmp.actual.tax, other: 0, keep: cmp.actual.cash, inCo: 0 }] : []),
    {
      key: "co",
      title: t("Company", "บริษัท"),
      tax: cmp.company.totalTax,
      other: cmp.company.runningCosts + cmp.company.formation + cmp.company.sso.employee + cmp.company.sso.employer,
      keep: cmp.company.cash + cmp.company.pvd.employee + cmp.company.pvd.employer,
      inCo: cmp.company.retained,
    },
  ]
  return (
    <div className="sheet flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <span className="text-[12.5px] font-medium text-muted-foreground">
          {companyLessTax ? t("A company pays less tax", "บริษัทเสียภาษีน้อยกว่า") : t("Staying personal pays less tax", "รับในนามบุคคลเสียภาษีน้อยกว่า")}
        </span>
        <span className={cn("num text-[36px] leading-none font-semibold tracking-[-0.03em]", companyLessTax ? "text-leaf" : "text-foreground")}>
          {baht(Math.abs(taxSaved))}
          <span className="ml-1.5 text-[14px] font-medium tracking-normal text-muted-foreground">{t("baht a year", "บาทต่อปี")}</span>
        </span>
        <span className="num mt-1 text-[13px] text-muted-foreground">
          {t(`Total tax ${baht(personalTax)} personally, ${baht(cmp.company.totalTax)} through a company.`, `ภาษีรวม ${baht(personalTax)} บาทในนามบุคคล และ ${baht(cmp.company.totalTax)} บาทผ่านบริษัท`)}{" "}
          {diff > 0
            ? t(`After running costs and profit kept in the company, you keep ${baht(diff)} more through the company.`, `หลังหักค่าดูแลบริษัทและกำไรที่เก็บไว้ในบริษัท คุณเหลือเงินมากกว่า ${baht(diff)} บาทเมื่อผ่านบริษัท`)
            : t(`After running costs and profit kept in the company, you keep ${baht(-diff)} more personally.`, `หลังหักค่าดูแลบริษัทและกำไรที่เก็บไว้ในบริษัท คุณเหลือเงินมากกว่า ${baht(-diff)} บาทเมื่อรับในนามบุคคล`)}
        </span>
      </div>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-[13px]">
          <thead>
            <tr className="text-[11.5px] text-muted-foreground">
              <th className="px-1 pb-2 text-left font-normal" />
              {cols.map((c) => (
                <th key={c.key} className="px-1 pb-2 text-right font-medium">
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="num">
            <tr className="border-t border-border">
              <td className="px-1 py-2 text-muted-foreground">{t("All tax", "ภาษีทั้งหมด")}</td>
              {cols.map((c) => (
                <td key={c.key} className="px-1 py-2 text-right">{baht(c.tax)}</td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="px-1 py-2 text-muted-foreground">{t("Running costs and SSO", "ค่าดูแลบริษัทและประกันสังคม")}</td>
              {cols.map((c) => (
                <td key={c.key} className="px-1 py-2 text-right">{c.other ? baht(c.other) : "–"}</td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <td className="px-1 py-2 text-muted-foreground">{t("Kept in the company", "เก็บไว้ในบริษัท")}</td>
              {cols.map((c) => (
                <td key={c.key} className="px-1 py-2 text-right">{c.inCo ? baht(c.inCo) : "–"}</td>
              ))}
            </tr>
            <tr className="border-t border-border font-semibold">
              <td className="px-1 py-2.5">{t("Reaches you", "ถึงมือคุณ")}</td>
              {cols.map((c) => (
                <td key={c.key} className={cn("px-1 py-2.5 text-right", c.key === "co" ? "text-ink" : "")}>
                  {baht(c.keep)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {t(
          "Company figures value profit kept in the company at 90%, the amount left after a later 10% dividend tax. Provident fund contributions count as yours.",
          "กำไรที่เก็บไว้ในบริษัทคิดมูลค่าร้อยละ 90 คือส่วนที่เหลือหลังภาษีเงินปันผลร้อยละ 10 ในอนาคต เงินกองทุนสำรองเลี้ยงชีพนับเป็นของคุณ",
        )}
      </p>
    </div>
  )
}

function CompanyBreakdown({ cmp, lang, s }: { cmp: CompanyComparison; lang: Lang; s: CompanyState }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const c = cmp.company
  return (
    <div className="sheet flex flex-col gap-3 p-5 sm:p-6">
      <h3 className="text-[14px] font-medium">{t("Inside the company", "รายละเอียดในบริษัท")}</h3>
      <dl className="flex flex-col gap-1.5 text-[13px]">
        <Row k={t("Revenue", "รายได้")} v={s.revenue} />
        <Row k={t("Your salary", "เงินเดือนของคุณ")} v={c.salary} sub={`${baht(c.salary / 12)} ${t("a month", "ต่อเดือน")}`} />
        <Row
          k={t("Accountant and running costs", "ค่าผู้ทำบัญชีและค่าใช้จ่ายดำเนินงาน")}
          v={c.runningCosts + c.formation}
          sub={t("Deducted as business expenses", "หักเป็นรายจ่ายของบริษัท")}
        />
        {c.depreciation > 0 ? <Row k={t("Depreciation on assets you sold it", "ค่าเสื่อมราคาทรัพย์สินที่ขายให้บริษัท")} v={c.depreciation} /> : null}
        {c.doubleExtra > 0 ? <Row k={t("Extra deduction from 2x spend", "รายจ่ายที่หักเพิ่มจากมาตรการ 2 เท่า")} v={c.doubleExtra} /> : null}
        <Row k={t("Taxable profit", "กำไรสุทธิทางภาษี")} v={c.profitBeforeTax} strong />
        <Row k={cmp.smeEligible ? t("Corporate tax, SME rates", "ภาษีเงินได้นิติบุคคล อัตรา SME") : t("Corporate tax, 20%", "ภาษีเงินได้นิติบุคคล ร้อยละ 20")} v={c.cit} />
        {c.reserve > 0 ? <Row k={t("Legal reserve, 5% of profit", "ทุนสำรองตามกฎหมาย ร้อยละ 5")} v={c.reserve} /> : null}
        <Row k={t("Dividend", "เงินปันผล")} v={c.dividend} />
        <Row
          k={t("Tax on your salary and dividend", "ภาษีของเงินเดือนและเงินปันผล")}
          v={c.ownerTax}
          sub={
            c.dividend > 0
              ? c.dividendIncluded
                ? t(`Dividend included with ${percent(c.creditFraction / (1 + c.creditFraction), 1)} credit`, `นำเงินปันผลมารวม เครดิตภาษีร้อยละ ${(100 * c.creditFraction / (1 + c.creditFraction)).toFixed(1)}`)
                : t("Dividend taxed at 10% final", "เงินปันผลเสียภาษีร้อยละ 10 เป็นภาษีสุดท้าย")
              : undefined
          }
        />
        {c.assetProceeds > 0 ? <Row k={t("Paid to you for assets, tax free", "เงินค่าทรัพย์สินที่ได้รับ ไม่ต้องเสียภาษี")} v={c.assetProceeds} muted /> : null}
      </dl>
    </div>
  )
}

function Obligations({ lang, vat }: { lang: Lang; vat: boolean }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const items: [string, string][] = [
    [t("Every month", "ทุกเดือน"), t("PND 1 on your salary, PND 3 and PND 53 on payments withheld, social security by the 15th", "ภ.ง.ด.1 สำหรับเงินเดือน ภ.ง.ด.3 และ ภ.ง.ด.53 สำหรับภาษีหัก ณ ที่จ่าย ประกันสังคมภายในวันที่ 15")],
    ...(vat ? ([[t("Every month, VAT", "ทุกเดือน ภาษีมูลค่าเพิ่ม"), t("PP 30 by the 15th; revenue above 1.8M requires VAT registration in either structure", "ภ.พ.30 ภายในวันที่ 15 รายได้เกิน 1.8 ล้านบาทต้องจดทะเบียนภาษีมูลค่าเพิ่มไม่ว่ารูปแบบใด")]] as [string, string][]) : []),
    [t("When paying dividends", "เมื่อจ่ายเงินปันผล"), t("PND 2 for the 10% withheld, within 7 days of the next month", "ภ.ง.ด.2 สำหรับภาษีร้อยละ 10 ภายใน 7 วันของเดือนถัดไป")],
    [t("End of February", "สิ้นเดือนกุมภาพันธ์"), t("PND 1 Kor, the annual salary summary", "ภ.ง.ด.1ก สรุปเงินเดือนทั้งปี")],
    [t("By 30 April", "ภายใน 30 เมษายน"), t("Annual general meeting approves the audited accounts", "ประชุมสามัญผู้ถือหุ้นอนุมัติงบการเงิน")],
    [t("Within 150 days of year end", "ภายใน 150 วันหลังปิดบัญชี"), t("PND 50 with audited financial statements", "ภ.ง.ด.50 พร้อมงบการเงินที่ตรวจสอบแล้ว")],
    [t("Within a month of the AGM", "ภายใน 1 เดือนหลังประชุม"), t("Financial statements to DBD (Sor Bor Chor 3), shareholder list (Bor Or Jor 5) within 14 days", "ส่งงบการเงินต่อกรมพัฒนาธุรกิจการค้า (ส.บช.3) และบัญชีผู้ถือหุ้น (บอจ.5) ภายใน 14 วัน")],
    [t("By 31 August", "ภายใน 31 สิงหาคม"), t("PND 51, half the estimated year's tax; underestimating by more than 25% adds 20% of the shortfall", "ภ.ง.ด.51 ภาษีครึ่งปีจากประมาณการ ประมาณการขาดเกินร้อยละ 25 เสียเงินเพิ่มร้อยละ 20 ของภาษีที่ขาด")],
  ]
  return (
    <div className="sheet flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold">{t("What a company files", "สิ่งที่บริษัทต้องยื่น")}</h3>
        <Link to="/$lang/forms" params={{ lang }} className="inline-flex items-center gap-1 text-[13px] text-ink underline-offset-4 hover:underline">
          {t("All forms", "แบบฟอร์มทั้งหมด")}
          <ArrowSquareOutIcon className="size-3.5" />
        </Link>
      </div>
      <dl className="flex flex-col divide-y divide-border text-[13px]">
        {items.map(([when, what]) => (
          <div key={when} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="font-medium">{when}</dt>
            <dd className="text-muted-foreground">{what}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Section({ no, title, children }: { no: string; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-3 text-[17px] font-semibold tracking-[-0.012em]">
        <span className="num grid size-6 shrink-0 translate-y-[-1px] place-items-center rounded-full bg-primary text-[11.5px] font-semibold text-primary-foreground">{no}</span>
        {title}
      </h2>
      {children}
    </section>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 self-end rounded-lg bg-muted/60 px-3.5 py-2.5">
      <span className="text-[13px] leading-snug">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function Row({ k, v, sub, strong, muted }: { k: string; v: number; sub?: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4", strong && "border-t border-border pt-2 font-medium")}>
      <dt className={cn(muted ? "text-muted-foreground" : "", "min-w-0")}>
        {k}
        {sub ? <span className="block text-[11.5px] font-normal text-muted-foreground">{sub}</span> : null}
      </dt>
      <dd className={cn("num shrink-0", muted ? "text-muted-foreground" : "font-medium")}>{baht(v)}</dd>
    </div>
  )
}
