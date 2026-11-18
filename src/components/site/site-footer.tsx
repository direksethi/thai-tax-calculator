import { useAccountsEnabled } from "@/lib/accounts"
import { useLang } from "@/lib/i18n"
import { RULES_AS_OF } from "@/tax/years"

export function SiteFooter() {
  const lang = useLang()
  const accounts = useAccountsEnabled()
  const storage = accounts
    ? { en: "Calculated in your browser. Figures are stored only when you sign in and save.", th: "คำนวณในเบราว์เซอร์ของคุณ ข้อมูลจะถูกเก็บเมื่อคุณเข้าสู่ระบบและบันทึกเท่านั้น" }
    : { en: "Calculated in your browser. Figures are stored in this browser only.", th: "คำนวณในเบราว์เซอร์ของคุณ ข้อมูลถูกเก็บในเบราว์เซอร์นี้เท่านั้น" }
  return (
    <footer className="mt-24 border-t border-border/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[12.5px] leading-relaxed text-muted-foreground sm:px-6 md:flex-row md:justify-between">
        <p className="max-w-2xl">
          {lang === "en"
            ? `Figures follow the Revenue Code and Revenue Department announcements as of ${RULES_AS_OF.en}. This is an estimate, not tax advice. Confirm your figures against your withholding certificates and the e-Filing system before you file.`
            : `คำนวณตามประมวลรัษฎากรและประกาศกรมสรรพากร ณ ${RULES_AS_OF.th} ผลลัพธ์เป็นการประมาณการ ไม่ใช่คำแนะนำทางภาษี โปรดตรวจสอบกับหนังสือรับรองการหักภาษี ณ ที่จ่าย และระบบ e-Filing ก่อนยื่นแบบ`}
        </p>
        <p className="shrink-0">
          {storage[lang]}
          {" · "}
          {lang === "en" ? "Built by " : "พัฒนาโดย "}
          <a href="https://direksethi.com" className="underline-offset-4 hover:text-foreground hover:underline">
            Direk Sethi
          </a>
        </p>
      </div>
    </footer>
  )
}
