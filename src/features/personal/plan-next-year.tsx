import { ArrowRightIcon } from "@phosphor-icons/react"
import { useState } from "react"
import { Segmented } from "@/components/tax/segmented"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { baht, useLang } from "@/lib/i18n"
import { computePersonal } from "@/tax/personal"
import { nextYear, YEARS } from "@/tax/years"
import { rollForward } from "./roll-forward"
import type { PersonalState } from "./state"

/**
 * Starts next year from this one: the same income scaled by an expected change
 * and the recurring allowances, under next year's rules.
 */
export function PlanNextYear({ state, onPlan }: { state: PersonalState; onPlan: (next: PersonalState) => Promise<void> }) {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  const to = nextYear(state.profile.year)
  const [open, setOpen] = useState(false)
  const [growth, setGrowth] = useState("0")
  const [busy, setBusy] = useState(false)
  if (!to) return null
  const preview = rollForward(state, to, Number(growth))
  const now = computePersonal(state)
  const then = computePersonal(preview)
  const cfg = YEARS[to]

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t(`Plan ${to}`, `วางแผนปี ${to}`)}
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(`Plan ${cfg.label.en}`, `วางแผน${cfg.label.th}`)}</DialogTitle>
            <DialogDescription>
              {t(
                "Carries over your income and recurring allowances under next year's rules. One-off items such as Easy E-Receipt, travel, prenatal costs and solar are left out. This year stays as it is.",
                "นำเงินได้และค่าลดหย่อนที่เกิดขึ้นทุกปีไปคำนวณตามหลักเกณฑ์ของปีถัดไป รายการที่เกิดครั้งเดียว เช่น Easy E-Receipt ค่าท่องเที่ยว ค่าฝากครรภ์ และโซลาร์รูฟ จะไม่ถูกนำไป ข้อมูลปีนี้ยังอยู่เหมือนเดิม",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-medium">{t("Expected change in income", "ประมาณการการเปลี่ยนแปลงของเงินได้")}</span>
            <Segmented<string>
              size="sm"
              value={growth}
              onChange={setGrowth}
              options={["-0.1", "0", "0.05", "0.1", "0.2"].map((g) => ({ value: g, label: `${Number(g) > 0 ? "+" : ""}${Math.round(Number(g) * 100)}%` }))}
            />
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/60 p-4 text-[13px]">
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t(`Tax ${state.profile.year}`, `ภาษีปี ${state.profile.year}`)}</dt>
              <dd className="num text-[18px] font-semibold">{baht(now.taxDue)}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">{t(`Tax ${to}, projected`, `ภาษีปี ${to} ประมาณการ`)}</dt>
              <dd className="num text-[18px] font-semibold text-ink">{baht(then.taxDue)}</dd>
            </div>
          </dl>
          {cfg.year === 2570 ? (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              {t(
                "2570 rules known today: Thai ESG falls to 100,000 with an 8-year hold, the CCTV measure ends, social security stays at 10,500, art purchases and solar continue.",
                "หลักเกณฑ์ปี 2570 ที่ทราบในขณะนี้: Thai ESG ลดเหลือ 100,000 บาท ถือ 8 ปี มาตรการกล้องวงจรปิดสิ้นสุด ประกันสังคมคงที่ 10,500 บาท ค่าซื้องานศิลปะและโซลาร์รูฟยังใช้ได้",
              )}
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("Cancel", "ยกเลิก")}
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await onPlan(preview)
                setBusy(false)
                setOpen(false)
              }}
            >
              {busy ? <Spinner data-icon="inline-start" /> : null}
              {t(`Plan ${to}`, `วางแผนปี ${to}`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
