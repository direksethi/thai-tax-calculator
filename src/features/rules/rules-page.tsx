import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { PageHeader } from "@/components/site/page-header"
import { baht, percent, useLang, type L, type Lang } from "@/lib/i18n"
import { ALLOWANCES, GROUPS } from "@/tax/allowances"
import { PIT_BRACKETS } from "@/tax/brackets"
import { BUSINESS_TYPES } from "@/tax/business-types"
import { CATEGORIES } from "@/tax/income"
import { RULES_AS_OF, YEARS } from "@/tax/years"

const NAV: { id: string; label: L }[] = [
  { id: "rates", label: { en: "Tax rates", th: "อัตราภาษี" } },
  { id: "income", label: { en: "Income types", th: "ประเภทเงินได้" } },
  { id: "business", label: { en: "40(8) business rates", th: "อัตราหักเหมา 40(8)" } },
  { id: "allowances", label: { en: "Allowances", th: "ค่าลดหย่อน" } },
  { id: "changes", label: { en: "2569 changes", th: "การเปลี่ยนแปลงปี 2569" } },
  { id: "filing", label: { en: "Filing and deadlines", th: "การยื่นแบบและกำหนดเวลา" } },
  { id: "withholding", label: { en: "Withholding rates", th: "อัตราภาษีหัก ณ ที่จ่าย" } },
  { id: "company", label: { en: "Company tax", th: "ภาษีนิติบุคคล" } },
  { id: "traps", label: { en: "Common mistakes", th: "ข้อผิดพลาดที่พบบ่อย" } },
]

export function RulesPage() {
  const lang = useLang()
  const t = (en: string, th: string) => (lang === "en" ? en : th)
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <PageHeader
        eyebrow={t(`As of ${RULES_AS_OF.en}`, `ข้อมูล ณ ${RULES_AS_OF.th}`)}
        title={t("Rules", "หลักเกณฑ์ภาษี")}
        description={t(
          "The rates, limits and deadlines the calculators use, taken from the Revenue Code, Royal Decrees, Ministerial Regulations and the Revenue Department's 2568 and 2569 filing instructions.",
          "อัตรา เพดาน และกำหนดเวลาที่เครื่องคำนวณใช้ อ้างอิงประมวลรัษฎากร พระราชกฤษฎีกา กฎกระทรวง และคู่มือการกรอกแบบของกรมสรรพากรปี 2568 และ 2569",
        )}
      />
      <div className="grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label={t("Sections", "หัวข้อ")}>
          <ul className="sticky top-20 flex flex-col gap-0.5 text-[13px]">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="block rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground">
                  {n.label[lang]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-16">
          <Block id="rates" title={NAV[0].label[lang]}>
            <Table
              head={[t("Net income", "เงินได้สุทธิ"), t("Rate", "อัตรา"), t("Tax at top of band", "ภาษีสะสมสูงสุดของขั้น")]}
              rows={PIT_BRACKETS.map((b, i) => {
                const cumulative = PIT_BRACKETS.slice(0, i + 1).reduce((s, x) => s + (Number.isFinite(x.to) ? (x.to - x.from) * x.rate : 0), 0)
                return [
                  Number.isFinite(b.to) ? `${baht(b.from === 0 ? 0 : b.from + 1)} – ${baht(b.to)}` : `${t("Over", "เกิน")} ${baht(b.from)}`,
                  b.rate === 0 ? t("Exempt", "ยกเว้น") : percent(b.rate, 0),
                  Number.isFinite(b.to) ? baht(cumulative) : "–",
                ]
              })}
              numeric={[false, true, true]}
            />
            <Note>
              {t(
                "Minimum tax: when gross income other than salary is 120,000 baht or more, 0.5% of it is compared with tax at the rates above, and the higher is paid, unless 0.5% comes to 5,000 baht or less. In practice it only applies above 1,000,000 baht of non-salary income. Severance and real estate computed separately do not get the 0% first band.",
                "ภาษีขั้นต่ำ: เมื่อเงินได้พึงประเมินที่ไม่ใช่เงินเดือนตั้งแต่ 120,000 บาท ให้คำนวณร้อยละ 0.5 เปรียบเทียบกับภาษีตามอัตราก้าวหน้าแล้วเสียจำนวนที่มากกว่า เว้นแต่คำนวณได้ไม่เกิน 5,000 บาท ในทางปฏิบัติใช้เมื่อเงินได้ที่ไม่ใช่เงินเดือนเกิน 1,000,000 บาท เงินได้กรณีออกจากงานและการขายอสังหาริมทรัพย์ที่แยกคำนวณไม่ได้รับยกเว้น 150,000 บาทแรก",
              )}
            </Note>
          </Block>

          <Block id="income" title={NAV[1].label[lang]}>
            <div className="flex flex-col divide-y divide-border">
              {CATEGORIES.map((c) => (
                <div key={c.id} className="grid gap-2 py-4 sm:grid-cols-[5rem_1fr_14rem] sm:gap-6">
                  <span className="num text-[13px] font-medium">{c.section}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-medium">{c.label[lang]}</span>
                    <span className="text-[13px] leading-relaxed text-muted-foreground">{c.examples[lang]}</span>
                  </div>
                  <span className="text-[13px] leading-relaxed">{expenseRule(c.id, lang)}</span>
                </div>
              ))}
            </div>
            <Note>
              {t(
                "Freelance service work without materials is usually 40(2) and shares the 100,000 baht limit with salary, whatever the payer writes on the 50 Tawi. Choose 40(8) only for trading and the listed businesses.",
                "งานบริการฟรีแลนซ์ที่ไม่ได้จัดหาสัมภาระมักเป็นเงินได้ตามมาตรา 40(2) และใช้วงเงิน 100,000 บาทร่วมกับเงินเดือน ไม่ว่าผู้จ่ายจะระบุใน 50 ทวิ อย่างไร เลือก 40(8) เฉพาะการค้าและกิจการที่ระบุไว้",
              )}
            </Note>
          </Block>

          <Block id="business" title={NAV[2].label[lang]}>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {t(
                "Royal Decree No. 11 as amended by No. 629 (2560). Every listed business deducts 60% of gross income. Performers deduct 60% of the first 300,000 and 40% above, up to 600,000. Anything not listed deducts actual expenses only. Older tables with 65% to 85% are obsolete.",
                "พระราชกฤษฎีกาฉบับที่ 11 แก้ไขโดยฉบับที่ 629 (2560) กิจการที่ระบุหักค่าใช้จ่ายร้อยละ 60 ของเงินได้ นักแสดงหักร้อยละ 60 ของ 300,000 บาทแรก และร้อยละ 40 ของส่วนที่เกิน รวมไม่เกิน 600,000 บาท กิจการอื่นหักตามจริงเท่านั้น ตารางเดิมที่ระบุร้อยละ 65 ถึง 85 ไม่ใช้แล้ว",
              )}
            </p>
            <ul className="grid gap-x-8 gap-y-1.5 text-[13px] sm:grid-cols-2">
              {[...BUSINESS_TYPES].sort((a, b) => Number(a.key) - Number(b.key)).map((b) => (
                <li key={b.key} className="grid grid-cols-[2rem_1fr_auto] gap-2 py-0.5">
                  <span className="num text-muted-foreground">{b.key}</span>
                  <span>{b.label[lang]}</span>
                  <span className="num text-muted-foreground">{b.rate === null ? t("Actual", "ตามจริง") : percent(b.rate, 0)}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="allowances" title={NAV[3].label[lang]}>
            <Table
              head={[t("Item", "รายการ"), t("Allowance", "ค่าลดหย่อน"), "2568", "2569"]}
              rows={[
                ["1", t("Personal allowance", "ค่าลดหย่อนส่วนตัว"), "60,000", "60,000"],
                ["2", t("Spouse with no income", "คู่สมรสที่ไม่มีเงินได้"), "60,000", "60,000"],
                ...GROUPS.flatMap((g) =>
                  ALLOWANCES.filter((a) => a.group === g.id).map((a) => [
                    a.item || "–",
                    a.label[lang],
                    a.available(YEARS[2568], { status: "single" }) ? "✓" : "–",
                    a.available(YEARS[2569], { status: "single" }) ? (a.pending ? t("Pending", "รอกฎหมาย") : "✓") : "–",
                  ]),
                ),
              ]}
              numeric={[false, false, true, true]}
            />
            <div className="flex flex-col divide-y divide-border">
              {ALLOWANCES.map((a) => (
                <div key={a.id} className="grid gap-1 py-3.5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                  <span className="text-[13.5px] font-medium">{a.label[lang]}</span>
                  <span className="text-[13px] leading-relaxed text-muted-foreground">{a.rule[lang]}</span>
                </div>
              ))}
            </div>
            <Note>
              {t(
                "Shared limits: life and health insurance together 100,000. Provident fund, Government Pension Fund, teachers' fund, National Savings Fund, RMF and annuity insurance together 500,000. Thai ESG sits outside the 500,000. Donations come last and are capped at 10% of income after allowances.",
                "วงเงินรวม: ประกันชีวิตและประกันสุขภาพรวมไม่เกิน 100,000 บาท กองทุนสำรองเลี้ยงชีพ กบข. กองทุนครูเอกชน กอช. RMF และประกันบำนาญรวมไม่เกิน 500,000 บาท Thai ESG อยู่นอกวงเงิน 500,000 บาท เงินบริจาคหักเป็นลำดับสุดท้าย ไม่เกินร้อยละ 10 ของเงินได้หลังหักค่าลดหย่อน",
              )}
            </Note>
          </Block>

          <Block id="changes" title={NAV[4].label[lang]}>
            <ul className="flex flex-col gap-3 text-[14px] leading-relaxed">
              {CHANGES.map((c) => (
                <li key={c.en} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" />
                  <span>{c[lang]}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="filing" title={NAV[5].label[lang]}>
            <Table
              head={[t("Situation", "กรณี"), t("File when income exceeds", "ต้องยื่นเมื่อเงินได้เกิน")]}
              rows={[
                [t("PND 91, salary only, single", "ภ.ง.ด.91 เงินเดือนอย่างเดียว โสด"), "120,000"],
                [t("PND 91, salary only, married", "ภ.ง.ด.91 เงินเดือนอย่างเดียว สมรส"), "220,000"],
                [t("PND 90, other income, single", "ภ.ง.ด.90 เงินได้อื่น โสด"), "60,000"],
                [t("PND 90, other income, married", "ภ.ง.ด.90 เงินได้อื่น สมรส"), "120,000"],
              ]}
              numeric={[false, true]}
            />
            <Table
              head={[t("Return", "แบบ"), t("Tax year 2568", "ปีภาษี 2568"), t("Tax year 2569", "ปีภาษี 2569")]}
              rows={[
                [t("PND 90 and 91 on paper", "ภ.ง.ด.90 และ 91 แบบกระดาษ"), YEARS[2568].paperDeadline[lang], YEARS[2569].paperDeadline[lang]],
                [t("PND 90 and 91 online", "ภ.ง.ด.90 และ 91 ทางอินเทอร์เน็ต"), YEARS[2568].onlineDeadline[lang], YEARS[2569].onlineDeadline[lang]],
                [t("PND 94 half-year", "ภ.ง.ด.94 ครึ่งปี"), t("30 September 2025, online 8 October", "30 กันยายน 2568 ออนไลน์ 8 ตุลาคม"), t("30 September 2026, online 8 October", "30 กันยายน 2569 ออนไลน์ 8 ตุลาคม")],
              ]}
            />
            <ul className="flex flex-col gap-2.5 text-[14px] leading-relaxed">
              {FILING_FACTS.map((f) => (
                <li key={f.en} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{f[lang]}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block id="withholding" title={NAV[6].label[lang]}>
            <Table
              head={[t("Payment", "การจ่าย"), t("To a person", "จ่ายบุคคลธรรมดา"), t("To a company", "จ่ายนิติบุคคล")]}
              rows={WHT.map((w) => [w.what[lang], w.person === "Progressive" ? t("Progressive", "อัตราก้าวหน้า") : w.person, w.company])}
              numeric={[false, true, true]}
            />
            <Note>
              {t(
                "Payments made through the e-Withholding Tax system are withheld at 1% instead of 5%, 3% or 2% from 1 January 2569 to 31 December 2570 (Ministerial Regulation 402). Contracts under 1,000 baht need no withholding. The tax withheld is a credit on your annual return, not an extra tax.",
                "การจ่ายผ่านระบบ e-Withholding Tax หักภาษีร้อยละ 1 แทนร้อยละ 5 3 หรือ 2 ตั้งแต่ 1 มกราคม 2569 ถึง 31 ธันวาคม 2570 (กฎกระทรวงฉบับที่ 402) สัญญาที่ต่ำกว่า 1,000 บาทไม่ต้องหัก ภาษีที่ถูกหักนำไปเครดิตในแบบประจำปี ไม่ใช่ภาษีเพิ่ม",
              )}
            </Note>
          </Block>

          <Block id="company" title={NAV[7].label[lang]}>
            <Table
              head={[t("Net profit", "กำไรสุทธิ"), t("SME rate", "อัตรา SME"), t("Other companies", "บริษัททั่วไป")]}
              rows={[
                ["0 – 300,000", t("Exempt", "ยกเว้น"), "20%"],
                ["300,001 – 3,000,000", "15%", "20%"],
                [t("Over 3,000,000", "เกิน 3,000,000"), "20%", "20%"],
              ]}
              numeric={[false, true, true]}
            />
            <ul className="flex flex-col gap-2.5 text-[14px] leading-relaxed">
              {COMPANY_FACTS.map((f) => (
                <li key={f.en} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{f[lang]}</span>
                </li>
              ))}
            </ul>
            <Link to="/$lang/company" params={{ lang }} className="self-start text-[14px] font-medium text-ink underline-offset-4 hover:underline">
              {t("Compare a company with earning personally", "เปรียบเทียบการจดบริษัทกับการรับเงินในนามบุคคล")}
            </Link>
          </Block>

          <Block id="traps" title={NAV[8].label[lang]}>
            <ol className="flex flex-col gap-3 text-[14px] leading-relaxed">
              {TRAPS.map((tr, i) => (
                <li key={tr.en} className="grid grid-cols-[1.75rem_1fr] gap-2">
                  <span className="num text-muted-foreground">{i + 1}</span>
                  <span>{tr[lang]}</span>
                </li>
              ))}
            </ol>
          </Block>
        </div>
      </div>
    </div>
  )
}

function expenseRule(id: string, lang: Lang): string {
  const map: Record<string, L> = {
    "40_1": { en: "50% of salary and fees combined, up to 100,000", th: "ร้อยละ 50 รวมกับ 40(2) ไม่เกิน 100,000 บาท" },
    "40_2": { en: "Shares the 50% / 100,000 with salary", th: "ใช้ร้อยละ 50 ไม่เกิน 100,000 บาท ร่วมกับเงินเดือน" },
    "40_3": { en: "50% up to 100,000, or actual. Annuities from wills: none", th: "ร้อยละ 50 ไม่เกิน 100,000 บาท หรือตามจริง เงินปีจากพินัยกรรมไม่ได้หัก" },
    "40_4": { en: "No expense. Interest 15% and dividends 10% can be final", th: "ไม่มีค่าใช้จ่าย ดอกเบี้ยร้อยละ 15 และเงินปันผลร้อยละ 10 เลือกเป็นภาษีสุดท้ายได้" },
    "40_5": { en: "Buildings and vehicles 30%, farmland 20%, other land 15%, other 10%, or actual", th: "บ้าน โรงเรือน ยานพาหนะ ร้อยละ 30 ที่ดินเกษตร 20 ที่ดินอื่น 15 อื่น ๆ 10 หรือตามจริง" },
    "40_6": { en: "Medicine and fine arts 60%, other professions 30%, or actual", th: "การประกอบโรคศิลปะและประณีตศิลปกรรม ร้อยละ 60 วิชาชีพอื่นร้อยละ 30 หรือตามจริง" },
    "40_7": { en: "60%, or actual", th: "ร้อยละ 60 หรือตามจริง" },
    "40_8": { en: "60% for 43 listed businesses, or actual", th: "ร้อยละ 60 สำหรับ 43 กิจการที่ระบุ หรือตามจริง" },
  }
  return map[id][lang]
}

const CHANGES: L[] = [
  { en: "Social security deduction rises to 10,500 baht as the wage ceiling becomes 17,500 from 1 January 2569.", th: "ค่าลดหย่อนประกันสังคมเพิ่มเป็น 10,500 บาท จากเพดานค่าจ้าง 17,500 บาท ตั้งแต่ 1 มกราคม 2569" },
  { en: "New solar rooftop deduction, up to 200,000 baht once, from 3 March 2569 to 31 December 2571 (Royal Decree 805).", th: "ค่าลดหย่อนโซลาร์รูฟใหม่ ไม่เกิน 200,000 บาท ใช้ได้ครั้งเดียว ตั้งแต่ 3 มีนาคม 2569 ถึง 31 ธันวาคม 2571 (พ.ร.ฎ. 805)" },
  { en: "Energy-saving equipment with a 5-star label: an extra 50% for business and professional income.", th: "อุปกรณ์ประหยัดพลังงานฉลากเบอร์ 5 ดาว หักเพิ่มร้อยละ 50 สำหรับเงินได้จากธุรกิจและวิชาชีพ" },
  { en: "Donations to temples, foundations and charities count only through e-Donation.", th: "เงินบริจาคให้วัด มูลนิธิ และองค์กรการกุศล หักได้เฉพาะที่บริจาคผ่านระบบ e-Donation" },
  { en: "Education and sports donations count twice again from 2568 to 2570 (Royal Decrees 809 and 810, October 2569). 2568 returns filed at 1x can be amended.", th: "เงินบริจาคเพื่อการศึกษาและการกีฬากลับมาหักได้ 2 เท่า ปี 2568 ถึง 2570 (พ.ร.ฎ. 809 และ 810 ตุลาคม 2569) ผู้ที่ยื่นปี 2568 ไปแล้วแบบ 1 เท่ายื่นเพิ่มเติมได้" },
  { en: "Thai ESG stays at 30% and 300,000 baht with a 5-year hold for 2569, then falls to 100,000 baht and 8 years from 2570.", th: "Thai ESG คงร้อยละ 30 ไม่เกิน 300,000 บาท ถือ 5 ปี สำหรับปี 2569 ตั้งแต่ปี 2570 ลดเหลือ 100,000 บาท ถือ 8 ปี" },
  { en: "Thai ESGX has no new purchase window. The LTF switch remainder is deducted at up to 50,000 baht a year from 2569 to 2572.", th: "Thai ESGX ไม่มีการซื้อใหม่ ส่วนที่สับเปลี่ยนจาก LTF ทยอยหักไม่เกินปีละ 50,000 บาท ปี 2569 ถึง 2572" },
  { en: "Easy E-Receipt and the domestic travel deduction applied to 2568 only. No 2569 round has been enacted.", th: "Easy E-Receipt และค่าท่องเที่ยวในประเทศใช้เฉพาะปี 2568 ยังไม่มีมาตรการสำหรับปี 2569" },
  { en: "Flood repair deductions (home up to 100,000, vehicle up to 30,000) were approved by cabinet on 20 October 2569 and await a Ministerial Regulation.", th: "ค่าลดหย่อนซ่อมแซมจากอุทกภัย (บ้านไม่เกิน 100,000 รถไม่เกิน 30,000 บาท) คณะรัฐมนตรีอนุมัติเมื่อ 20 ตุลาคม 2569 รอกฎกระทรวง" },
  { en: "Crypto gains through SEC-licensed Thai exchanges are exempt from 2568 to 2572 (Ministerial Regulation 399).", th: "กำไรจากคริปโทที่ขายผ่านผู้ให้บริการที่ได้รับอนุญาตจาก ก.ล.ต. ได้รับยกเว้นปี 2568 ถึง 2572 (กฎกระทรวงฉบับที่ 399)" },
  { en: "The 8-day online filing extension covers deadlines to January 2570. A renewal for the 2569 filing season has not been announced.", th: "การขยายเวลายื่นออนไลน์ 8 วันครอบคลุมถึงเดือนมกราคม 2570 ยังไม่มีประกาศขยายสำหรับการยื่นแบบปีภาษี 2569" },
]

const FILING_FACTS: L[] = [
  { en: "File even when no tax is due, once income passes the threshold. Filing is also the only way to get withheld tax back.", th: "ต้องยื่นแบบแม้ไม่มีภาษีต้องชำระ เมื่อเงินได้เกินเกณฑ์ การยื่นแบบยังเป็นทางเดียวที่จะได้รับภาษีที่ถูกหักไว้คืน" },
  { en: "Tax of 3,000 baht or more can be paid in three equal instalments when the return is filed on time.", th: "ภาษีตั้งแต่ 3,000 บาทผ่อนชำระได้ 3 งวดเท่ากัน เมื่อยื่นแบบภายในกำหนด" },
  { en: "Late payment adds 1.5% a month on the unpaid tax, capped at the tax itself. Filing late carries a fine of up to 2,000 baht.", th: "ชำระล่าช้าเสียเงินเพิ่มร้อยละ 1.5 ต่อเดือนของภาษีที่ค้าง ไม่เกินจำนวนภาษี ยื่นแบบล่าช้ามีค่าปรับไม่เกิน 2,000 บาท" },
  { en: "Refunds are paid by PromptPay linked to your national ID number. Register PromptPay with your ID at any Thai bank.", th: "การคืนภาษีโอนเข้าพร้อมเพย์ที่ผูกกับเลขประจำตัวประชาชน ลงทะเบียนพร้อมเพย์ด้วยเลขบัตรประชาชนได้ที่ธนาคารทุกแห่ง" },
  { en: "Thai tax residents (180 days or more in the year) are taxed on foreign income in the year it is brought into Thailand, for income earned from 2567.", th: "ผู้อยู่ในประเทศไทยตั้งแต่ 180 วันในปีภาษี ต้องเสียภาษีเงินได้จากต่างประเทศในปีที่นำเข้ามา สำหรับเงินได้ที่เกิดตั้งแต่ปี 2567" },
  { en: "People aged 65 or over, and disabled people under 65, have 190,000 baht of income exempt.", th: "ผู้มีอายุ 65 ปีขึ้นไป และคนพิการที่อายุไม่ถึง 65 ปี ได้รับยกเว้นเงินได้ 190,000 บาท" },
]

const WHT: { what: L; person: string; company: string }[] = [
  { what: { en: "Services and hire of work", th: "ค่าบริการและค่าจ้างทำของ" }, person: "3%", company: "3%" },
  { what: { en: "Professional fees", th: "ค่าวิชาชีพอิสระ" }, person: "3%", company: "3%" },
  { what: { en: "Rent, car rental without driver", th: "ค่าเช่า ค่าเช่ารถไม่มีคนขับ" }, person: "5%", company: "5%" },
  { what: { en: "Advertising", th: "ค่าโฆษณา" }, person: "2%", company: "2%" },
  { what: { en: "Transport", th: "ค่าขนส่ง" }, person: "1%", company: "1%" },
  { what: { en: "Prizes and contests", th: "รางวัลจากการประกวดหรือชิงโชค" }, person: "5%", company: "5%" },
  { what: { en: "Interest", th: "ดอกเบี้ย" }, person: "15%", company: "1%" },
  { what: { en: "Dividends", th: "เงินปันผล" }, person: "10%", company: "10%" },
  { what: { en: "Salary and 40(2) fees", th: "เงินเดือนและเงินได้ตามมาตรา 40(2)" }, person: "Progressive", company: "–" },
]

const COMPANY_FACTS: L[] = [
  { en: "SME rates need paid-up capital of 5M or less and sales of 30M or less, tested at every year end since 2555. Exceeding either once loses them.", th: "อัตรา SME ใช้ได้เมื่อทุนชำระแล้วไม่เกิน 5 ล้านบาทและรายได้จากการขายไม่เกิน 30 ล้านบาท ทดสอบทุกรอบบัญชีตั้งแต่ปี 2555 หากเกินครั้งใดถือว่าเสียสิทธิ" },
  { en: "Dividends carry 10% withholding. Including them in PND 90 adds a credit of rate ÷ (100 − rate) of the dividend: 1/4 for profit taxed at 20%, 3/17 at 15%, none from the 0% band.", th: "เงินปันผลถูกหักภาษีร้อยละ 10 หากนำมารวมใน ภ.ง.ด.90 ได้เครดิตภาษีเท่ากับ อัตรา ÷ (100 − อัตรา) ของเงินปันผล คือ 1/4 สำหรับกำไรที่เสียภาษีร้อยละ 20 และ 3/17 สำหรับร้อยละ 15 ไม่มีเครดิตสำหรับส่วนที่ได้รับยกเว้น" },
  { en: "A limited company sets aside 5% of profit with each dividend until the reserve reaches 10% of registered capital.", th: "บริษัทจำกัดต้องจัดสรรทุนสำรองร้อยละ 5 ของกำไรทุกครั้งที่จ่ายเงินปันผล จนกว่าทุนสำรองจะถึงร้อยละ 10 ของทุนจดทะเบียน" },
  { en: "A company needs at least two promoters, a CPA audit every year, and DBD fees of 5,500 baht to register. Limited partnerships pay 1,000 baht and may use a tax auditor when small.", th: "บริษัทต้องมีผู้เริ่มก่อการอย่างน้อย 2 คน ตรวจสอบบัญชีโดย CPA ทุกปี และค่าธรรมเนียมจดทะเบียน 5,500 บาท ห้างหุ้นส่วนจำกัดเสีย 1,000 บาท และใช้ผู้สอบบัญชีภาษีอากรได้หากมีขนาดเล็ก" },
  { en: "Not deductible: corporate tax itself, fines, personal expenses, salary to shareholders beyond a reasonable level, and bonuses fixed from profit after year end.", th: "รายจ่ายที่หักไม่ได้: ภาษีเงินได้นิติบุคคล เบี้ยปรับ ค่าใช้จ่ายส่วนตัว เงินเดือนผู้ถือหุ้นส่วนที่เกินสมควร และโบนัสที่กำหนดจากกำไรหลังสิ้นรอบบัญชี" },
  { en: "Passenger cars depreciate on up to 1,000,000 baht of cost; rent is deductible up to 36,000 a month. Computers and software are written off over 3 years. Entertainment is capped at 0.3% of revenue or capital.", th: "รถยนต์นั่งหักค่าเสื่อมได้ไม่เกินราคา 1,000,000 บาท ค่าเช่าหักได้ไม่เกินเดือนละ 36,000 บาท คอมพิวเตอร์และซอฟต์แวร์ตัดค่าเสื่อม 3 ปี ค่ารับรองไม่เกินร้อยละ 0.3 ของรายได้หรือทุน" },
  { en: "VAT registration is required above 1,800,000 baht of turnover, for people and companies alike. The 7% rate runs until 30 September 2570.", th: "ต้องจดทะเบียนภาษีมูลค่าเพิ่มเมื่อรายรับเกิน 1,800,000 บาท ทั้งบุคคลธรรมดาและนิติบุคคล อัตราร้อยละ 7 ใช้ถึง 30 กันยายน 2570" },
]

const TRAPS: L[] = [
  { en: "Using 300,000 or 300 days as the severance exemption. It is 400 days of wages, up to 600,000, and only when laid off.", th: "ใช้ 300,000 บาทหรือ 300 วันเป็นเพดานค่าชดเชยที่ได้รับยกเว้น ที่ถูกต้องคือค่าจ้าง 400 วัน ไม่เกิน 600,000 บาท และเฉพาะกรณีถูกเลิกจ้าง" },
  { en: "Claiming SSF in 2568 or 2569. The deduction ended with 2567 purchases.", th: "ใช้สิทธิ SSF ในปี 2568 หรือ 2569 สิทธิสิ้นสุดสำหรับการซื้อในปี 2567" },
  { en: "Counting parents' health insurance as 15,000 per parent. It is 15,000 in total.", th: "นับเบี้ยประกันสุขภาพบิดามารดา 15,000 บาทต่อคน ที่ถูกต้องคือรวมไม่เกิน 15,000 บาท" },
  { en: "Using 9,000 baht for social security in 2569. The maximum is 10,500.", th: "ใช้ประกันสังคม 9,000 บาทในปี 2569 เพดานที่ถูกต้องคือ 10,500 บาท" },
  { en: "Claiming 60% for plain freelance services under 40(8). Service work is usually 40(2).", th: "หักเหมาร้อยละ 60 สำหรับงานบริการฟรีแลนซ์ในฐานะ 40(8) งานบริการส่วนใหญ่เป็น 40(2)" },
  { en: "Including only some dividends. Thai dividends and fund distributions are all in or all out.", th: "นำเงินปันผลมารวมเพียงบางส่วน เงินปันผลจากบริษัทไทยและกองทุนรวมต้องนำมารวมทั้งหมดหรือไม่นำมาเลย" },
  { en: "Forgetting that annuity insurance first fills unused room in the 100,000 life insurance limit.", th: "ลืมว่าเบี้ยประกันบำนาญต้องใช้วงเงินประกันชีวิต 100,000 บาทที่เหลือก่อน" },
  { en: "Applying the 190,000 exemption after expenses. It comes off gross income first.", th: "หักยกเว้น 190,000 บาทหลังหักค่าใช้จ่าย ที่ถูกต้องคือหักจากเงินได้พึงประเมินก่อน" },
  { en: "Losing the spouse allowance without noticing: it applies only when the spouse has no income.", th: "ใช้สิทธิคู่สมรสทั้งที่คู่สมรสมีเงินได้ สิทธินี้ใช้ได้เฉพาะคู่สมรสที่ไม่มีเงินได้" },
  { en: "E-filing without paying by the deadline. An unpaid online return counts as not filed.", th: "ยื่นแบบออนไลน์แต่ไม่ชำระภาษีภายในกำหนด ถือว่าไม่ได้ยื่นแบบ" },
  { en: "Adding up a family's life and health insurance under one person. Only your own premiums count, plus 10,000 for a spouse with no income.", th: "รวมเบี้ยประกันของทั้งครอบครัวไว้ที่คนเดียว ใช้ได้เฉพาะเบี้ยของตนเอง และของคู่สมรสที่ไม่มีเงินได้ไม่เกิน 10,000 บาท" },
  { en: "Assuming a company always saves tax. Below about 2,000,000 baht of profit the running costs usually cancel the saving, and 40(8) traders with the 60% deduction often pay less personally.", th: "เข้าใจว่าจดบริษัทประหยัดภาษีเสมอ หากกำไรต่ำกว่าประมาณ 2,000,000 บาท ค่าดูแลบริษัทมักหักล้างส่วนที่ประหยัดได้ และผู้ค้าตามมาตรา 40(8) ที่หักเหมาร้อยละ 60 มักเสียภาษีในนามบุคคลน้อยกว่า" },
]

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-5">
      <h2 className="text-[20px] font-semibold tracking-[-0.015em]">{title}</h2>
      {children}
    </section>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-muted/70 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">{children}</p>
}

function Table({ head, rows, numeric = [] }: { head: string[]; rows: string[][]; numeric?: boolean[] }) {
  return (
    <div className="sheet overflow-x-auto">
      <table className="w-full min-w-[28rem] text-[13.5px]">
        <thead>
          <tr className="border-b border-border text-[12px] text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-2.5 font-medium ${numeric[i] ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={`${r[0]}-${ri}`} className="border-b border-border last:border-0">
              {r.map((c, i) => (
                <td key={`${i}-${c}`} className={`px-4 py-2.5 ${numeric[i] ? "num text-right" : ""} ${i === 0 ? "text-foreground" : "text-foreground/90"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
