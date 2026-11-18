import { createFileRoute } from "@tanstack/react-router"
import { FormsPage } from "@/features/forms/forms-page"
import { pageHead } from "@/lib/seo"

export const Route = createFileRoute("/$lang/forms")({
  head: ({ params }) =>
    pageHead(
      params,
      "/forms",
      { en: "Thai tax forms and deadlines", th: "แบบฟอร์มภาษีและกำหนดยื่น" },
      {
        en: "PND 90, PND 91, PND 94, 50 Tawi, PND 1, PND 3, PND 50, PND 51, VAT and company filings, with deadlines and official PDFs.",
        th: "ภ.ง.ด.90 ภ.ง.ด.91 ภ.ง.ด.94 50 ทวิ ภ.ง.ด.1 ภ.ง.ด.3 ภ.ง.ด.50 ภ.ง.ด.51 ภาษีมูลค่าเพิ่ม และแบบของนิติบุคคล พร้อมกำหนดยื่นและไฟล์ทางการ",
      },
    ),
  component: FormsPage,
})
