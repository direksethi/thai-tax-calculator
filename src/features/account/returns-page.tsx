import { ArrowRightIcon, TrashIcon } from "@phosphor-icons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"
import { PageHeader } from "@/components/site/page-header"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { authClient } from "@/lib/auth-client"
import { baht, useLang, type Lang } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { deleteReturn, getReturn, listReturns, saveReturn, type SavedReturnMeta } from "@/server/returns"
import { computePersonal } from "@/tax/personal"
import type { TaxYear } from "@/tax/types"
import { nextYear, YEARS } from "@/tax/years"
import { rollForward } from "@/features/personal/roll-forward"
import { initialState, type PersonalState } from "@/features/personal/state"

export function ReturnsPage() {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  const [rows, setRows] = useState<SavedReturnMeta[] | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedReturnMeta | null>(null)
  const [planning, setPlanning] = useState<string | null>(null)

  const load = useCallback(() => {
    void listReturns().then(setRows)
  }, [])

  useEffect(() => {
    if (isPending) return
    if (!session) {
      void navigate({ to: "/$lang/sign-in", params: { lang }, search: { next: `/${lang}/returns` }, replace: true })
      return
    }
    load()
  }, [session, isPending, lang, navigate, load])

  async function planNext(row: SavedReturnMeta) {
    const to = nextYear(row.year as TaxYear)
    const full = to ? await getReturn({ data: { id: row.id } }) : null
    if (!to || !full) return
    setPlanning(row.id)
    const saved = JSON.parse(full.dataJson) as Partial<PersonalState>
    const base = initialState()
    const state: PersonalState = { ...base, ...saved, profile: { ...base.profile, ...saved.profile } }
    const next = rollForward(state, to, 0)
    const { savedId: _s, name: _n, ...data } = next
    const r = computePersonal(next)
    const res = await saveReturn({
      data: { kind: "personal", year: to, name: t(`${to} plan`, `แผนปี ${to}`), data, summary: { tax: r.taxDue, balance: r.balance, income: r.totalGross, form: r.form } },
    })
    setPlanning(null)
    await navigate({ to: "/$lang", params: { lang }, search: { return: res.id } })
  }

  const years = rows ? [...new Set(rows.map((r) => r.year))].sort((a, b) => b - a) : []

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <PageHeader
        eyebrow={session?.user.email}
        title={t("Saved returns", "แบบที่บันทึกไว้")}
        description={t("Each year's return and company comparison, saved to your account. Changes save automatically while a return is open.", "แบบของแต่ละปีและการเปรียบเทียบรูปแบบบริษัทที่บันทึกในบัญชีของคุณ ระหว่างเปิดแบบ การแก้ไขจะบันทึกโดยอัตโนมัติ")}
        aside={
          <div className="flex gap-2">
            <Button variant="outline" nativeButton={false} render={<Link to="/$lang/company" params={{ lang }} search={{}} />}>
              {t("New comparison", "เปรียบเทียบใหม่")}
            </Button>
            <Button nativeButton={false} render={<Link to="/$lang" params={{ lang }} search={{}} />}>{t("New return", "แบบใหม่")}</Button>
          </div>
        }
      />

      {rows === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : rows.length === 0 ? (
        <div className="sheet flex flex-col items-start gap-3 p-6">
          <p className="text-[15px] font-medium">{t("No saved returns", "ยังไม่มีแบบที่บันทึก")}</p>
          <p className="text-[13.5px] text-muted-foreground">{t("Fill in the calculator, then choose Save.", "กรอกข้อมูลในเครื่องคำนวณ แล้วเลือกบันทึก")}</p>
          <Button nativeButton={false} render={<Link to="/$lang" params={{ lang }} search={{}} />}>{t("Open the calculator", "เปิดเครื่องคำนวณ")}</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {years.map((year) => (
            <section key={year} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-4 px-1">
                <h2 className="text-[15px] font-semibold">{YEARS[year as TaxYear]?.label[lang] ?? year}</h2>
                {YEARS[year as TaxYear]?.projected ? <span className="text-[12.5px] text-muted-foreground">{t("Projected rules", "หลักเกณฑ์ประมาณการ")}</span> : null}
              </div>
              <div className="sheet flex flex-col divide-y divide-border">
                {rows
                  .filter((r) => r.year === year)
                  .map((r) => (
                    <ReturnRow key={r.id} r={r} lang={lang} planning={planning === r.id} onPlan={() => void planNext(r)} onDelete={() => setPendingDelete(r)} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`Delete "${pendingDelete?.name}"?`, `ลบ "${pendingDelete?.name}" หรือไม่`)}</AlertDialogTitle>
            <AlertDialogDescription>{t("The saved figures are removed from your account and cannot be restored.", "ข้อมูลที่บันทึกจะถูกลบออกจากบัญชีและกู้คืนไม่ได้")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "ยกเลิก")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (!pendingDelete) return
                await deleteReturn({ data: { id: pendingDelete.id } })
                setPendingDelete(null)
                load()
              }}
            >
              {t("Delete return", "ลบแบบ")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReturnRow({ r, lang, planning, onPlan, onDelete }: { r: SavedReturnMeta; lang: Lang; planning: boolean; onPlan: () => void; onDelete: () => void }) {
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const to = r.kind === "personal" ? nextYear(r.year as TaxYear) : null
  const balance = r.summary.balance ?? 0
  const updated = new Date(r.updatedAt).toLocaleDateString(lang === "en" ? "en-GB" : "th-TH", { day: "numeric", month: "short", year: "numeric" })
  return (
    <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5">
      <Link
        to={r.kind === "personal" ? "/$lang" : "/$lang/company"}
        params={{ lang }}
        search={{ return: r.id }}
        className="flex min-w-0 flex-1 flex-col gap-1"
      >
        <span className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium hover:underline">{r.name}</span>
          <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10.5px] font-normal text-muted-foreground">
            {r.kind === "personal" ? (r.summary.form === "PND91" ? t("PND 91", "ภ.ง.ด.91") : t("PND 90", "ภ.ง.ด.90")) : t("Company comparison", "เปรียบเทียบบริษัท")}
          </Badge>
        </span>
        <span className="num text-[12.5px] text-muted-foreground">
          {t("Income", "เงินได้")} {baht(r.summary.income)} · {t("Updated", "แก้ไข")} {updated}
        </span>
      </Link>
      <div className="flex items-center gap-4 sm:justify-end">
        {r.kind === "personal" ? (
          <div className="flex flex-col items-end">
            <span className={cn("num text-[15px] font-semibold", balance > 0.5 ? "text-stamp" : balance < -0.5 ? "text-leaf" : "")}>{baht(Math.abs(balance))}</span>
            <span className="text-[11.5px] text-muted-foreground">{balance > 0.5 ? t("to pay", "ชำระเพิ่ม") : balance < -0.5 ? t("refund", "ได้คืน") : t("no tax", "ไม่มีภาษี")}</span>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="num text-[15px] font-semibold">{baht(r.summary.tax)}</span>
            <span className="text-[11.5px] text-muted-foreground">{t("total tax", "ภาษีรวม")}</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          {to ? (
            <Button size="sm" variant="ghost" onClick={onPlan} disabled={planning}>
              {t(`Plan ${to}`, `วางแผนปี ${to}`)}
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          ) : null}
          <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label={t("Delete return", "ลบแบบ")} className="text-muted-foreground">
            <TrashIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
