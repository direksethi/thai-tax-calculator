import { createFileRoute } from "@tanstack/react-router"
import { RulesPage } from "@/features/rules/rules-page"
import { pageHead } from "@/lib/seo"

export const Route = createFileRoute("/$lang/rules")({
  head: ({ params }) =>
    pageHead(
      params,
      "/rules",
      { en: "Thai income tax rules 2568 and 2569", th: "หลักเกณฑ์ภาษีเงินได้ปี 2568 และ 2569" },
      {
        en: "Thai personal income tax rates, section 40 income types, 40(8) deemed expense rates, every allowance, 2569 changes, deadlines, withholding rates and company tax.",
        th: "อัตราภาษีเงินได้บุคคลธรรมดา ประเภทเงินได้ตามมาตรา 40 อัตราหักเหมา 40(8) ค่าลดหย่อนทุกรายการ การเปลี่ยนแปลงปี 2569 กำหนดยื่น อัตราภาษีหัก ณ ที่จ่าย และภาษีนิติบุคคล",
      },
    ),
  component: RulesPage,
})
