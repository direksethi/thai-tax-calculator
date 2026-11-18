import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useMemo, type ReactNode } from "react"
import { PageHeader } from "@/components/site/page-header"
import { Segmented } from "@/components/tax/segmented"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useLang } from "@/lib/i18n"
import { computePersonal } from "@/tax/personal"
import type { FilingStatus, TaxYear } from "@/tax/types"
import { ALL_YEARS, YEARS } from "@/tax/years"
import { AllowanceSection } from "./allowance-section"
import { headroom } from "./headroom"
import { IncomeSection } from "./income-section"
import { ResultPanel, Verdict } from "./result-panel"
import { SpecialSection } from "./special-section"
import { initialState, usePersonalState, type PersonalState } from "./state"
import { SaveBar } from "@/features/account/save-bar"
import { useAccountsEnabled } from "@/lib/accounts"
import { authClient } from "@/lib/auth-client"
import { getReturn, saveReturn } from "@/server/returns"
import { PlanNextYear } from "./plan-next-year"

export function PersonalPage() {
  const lang = useLang()
  const [state, setState] = usePersonalState()
  const input = useMemo(
    () => ({
      profile: state.profile,
      incomes: state.incomes,
      allowances: state.allowances,
      pnd94Paid: state.pnd94Paid,
      foreignTaxCredit: state.foreignTaxCredit,
      severance: state.severance,
      property: state.property,
    }),
    [state],
  )
  const result = useMemo(() => computePersonal(input), [input])
  const rooms = useMemo(() => headroom(input, result), [input, result])
  const year = state.profile.year
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const search = useSearch({ strict: false }) as { return?: string }
  const navigate = useNavigate()
  const accounts = useAccountsEnabled()

  // Opening a saved return from the list loads it into the calculator.
  useEffect(() => {
    const id = search.return
    if (!accounts || !id || id === state.savedId) return
    let cancelled = false
    void getReturn({ data: { id } }).then((row) => {
      if (cancelled || !row || row.kind !== "personal") return
      const saved = JSON.parse(row.dataJson) as Partial<PersonalState>
      const base = initialState()
      setState({
        ...base,
        ...saved,
        profile: { ...base.profile, ...saved.profile },
        severance: { ...base.severance, ...saved.severance },
        property: { ...base.property, ...saved.property },
        savedId: row.id,
        name: row.name,
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.return])

  const { savedId, name, ...data } = state
  const defaultName = t(`${year} return`, `แบบปี ${year}`)
  const summary = { tax: result.taxDue, balance: result.balance, income: result.totalGross, form: result.form }

  async function plan(next: PersonalState) {
    const planName = t(`${next.profile.year} plan`, `แผนปี ${next.profile.year}`)
    let id: string | undefined
    const session = accounts ? (await authClient.getSession()).data : null
    if (session) {
      const { savedId: _s, name: _n, ...nextData } = next
      const r = computePersonal(next)
      const res = await saveReturn({ data: { kind: "personal", year: next.profile.year, name: planName, data: nextData, summary: { tax: r.taxDue, balance: r.balance, income: r.totalGross, form: r.form } } })
      id = res.id
    }
    setState({ ...next, savedId: id, name: id ? planName : undefined })
    await navigate({ to: "/$lang", params: { lang }, search: id ? { return: id } : {}, replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-0">
      <PageHeader
        eyebrow={YEARS[year].filing[lang]}
        title={t("Personal income tax", "คำนวณภาษีเงินได้บุคคลธรรมดา")}
        description={t(
          "Every income type under section 40, every allowance on the deductions attachment, and the line each figure goes on.",
          "เงินได้ทุกประเภทตามมาตรา 40 ค่าลดหย่อนทุกรายการในใบแนบ และบรรทัดที่ต้องกรอกในแบบ",
        )}
        aside={
          <Segmented<string>
            aria-label={t("Tax year", "ปีภาษี")}
            value={String(year)}
            onChange={(v) => setState((s) => ({ ...s, profile: { ...s.profile, year: Number(v) as TaxYear } }))}
            options={ALL_YEARS.map((y) => ({ value: String(y), label: YEARS[y].label[lang] }))}
          />
        }
      />

      <SaveBar
        kind="personal"
        year={year}
        data={data}
        summary={summary}
        savedId={savedId}
        name={name}
        defaultName={defaultName}
        onSaved={(id, n) => {
          setState((s) => ({ ...s, savedId: id, name: n }))
          void navigate({ to: "/$lang", params: { lang }, search: { return: id }, replace: true })
        }}
        onRename={(n) => setState((s) => ({ ...s, name: n }))}
        actions={<PlanNextYear state={state} onPlan={plan} />}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-12">
          <Section no="1" title={t("Status", "สถานภาพ")}>
            <div className="sheet flex flex-col gap-5 p-4 sm:p-5">
              <Segmented<FilingStatus>
                aria-label={t("Filing status", "สถานภาพ")}
                value={state.profile.status}
                onChange={(v) => setState((s) => ({ ...s, profile: { ...s.profile, status: v } }))}
                options={[
                  { value: "single", label: t("Single", "โสด") },
                  { value: "married_no_income", label: t("Married, spouse has no income", "สมรส คู่สมรสไม่มีเงินได้") },
                  { value: "married_separate", label: t("Married, spouse files separately", "สมรส ต่างฝ่ายต่างยื่น") },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle
                  label={t("Aged 65 or over this year", "อายุ 65 ปีขึ้นไปในปีภาษี")}
                  checked={state.profile.senior}
                  onChange={(v) => setState((s) => ({ ...s, profile: { ...s.profile, senior: v, disabled: v ? false : s.profile.disabled } }))}
                />
                <Toggle
                  label={t("Disability card holder, under 65", "ผู้พิการที่มีบัตร อายุไม่ถึง 65 ปี")}
                  checked={state.profile.disabled}
                  onChange={(v) => setState((s) => ({ ...s, profile: { ...s.profile, disabled: v, senior: v ? false : s.profile.senior } }))}
                />
              </div>
              {state.profile.senior || state.profile.disabled ? (
                <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {t(
                    "190,000 baht of income is exempt before expenses. It is placed where it saves the most tax.",
                    "เงินได้ 190,000 บาทได้รับยกเว้นก่อนหักค่าใช้จ่าย ระบบนำไปหักจากเงินได้ประเภทที่ประหยัดภาษีได้มากที่สุด",
                  )}
                </p>
              ) : null}
            </div>
          </Section>

          <Section no="2" title={t("Income", "เงินได้")}>
            <IncomeSection incomes={state.incomes} onChange={(incomes) => setState((s) => ({ ...s, incomes }))} />
          </Section>

          <Section no="3" title={t("Allowances", "ค่าลดหย่อน")}>
            <AllowanceSection
              year={year}
              status={state.profile.status}
              inputs={state.allowances}
              onChange={(allowances) => setState((s) => ({ ...s, allowances }))}
              result={result}
            />
          </Section>

          <Section no="4" title={t("Special cases and credits", "กรณีพิเศษและเครดิตภาษี")}>
            <SpecialSection
              severance={state.severance}
              property={state.property}
              pnd94Paid={state.pnd94Paid}
              foreignTaxCredit={state.foreignTaxCredit}
              result={result}
              onSeverance={(severance) => setState((s) => ({ ...s, severance }))}
              onProperty={(property) => setState((s) => ({ ...s, property }))}
              onPnd94={(pnd94Paid) => setState((s) => ({ ...s, pnd94Paid }))}
              onForeign={(foreignTaxCredit) => setState((s) => ({ ...s, foreignTaxCredit }))}
            />
          </Section>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setState(initialState())
                void navigate({ to: "/$lang", params: { lang }, search: {}, replace: true })
              }}
            >
              <ArrowCounterClockwiseIcon data-icon="inline-start" />
              {t("Start a new return", "เริ่มแบบใหม่")}
            </Button>
          </div>
        </div>

        <aside id="result" className="scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
          <ResultPanel r={result} year={year} headroom={rooms} />
        </aside>
      </div>

      <a
        href="#result"
        className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-4 rounded-xl bg-sheet/95 px-4 py-3 shadow-[0_0_0_1px_oklch(0.2_0.01_260/0.08),0_8px_24px_oklch(0.2_0.01_260/0.12)] backdrop-blur-md lg:hidden dark:bg-popover/95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Verdict r={result} year={year} compact />
        <span className="text-[13px] font-medium text-ink">{t("Details", "รายละเอียด")}</span>
      </a>
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

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg bg-muted/60 px-3.5 py-3">
      <span className="text-[13.5px]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}
