import { createFileRoute } from "@tanstack/react-router"
import { PersonalPage } from "@/features/personal/personal-page"
import { pageHead } from "@/lib/seo"

export const Route = createFileRoute("/$lang/")({
  validateSearch: (search: Record<string, unknown>): { return?: string } => ({ return: typeof search.return === "string" ? search.return : undefined }),
  head: ({ params }) =>
    pageHead(
      params,
      "",
      { en: "Thai personal income tax calculator", th: "คำนวณภาษีเงินได้บุคคลธรรมดา" },
      {
        en: "Calculate Thai personal income tax for 2568 and 2569: all income types under section 40, every allowance, PND 90 and PND 91 line by line.",
        th: "คำนวณภาษีเงินได้บุคคลธรรมดาปี 2568 และ 2569 ครบทุกประเภทเงินได้ตามมาตรา 40 ทุกรายการลดหย่อน และบรรทัดในแบบ ภ.ง.ด.90 และ ภ.ง.ด.91",
      },
    ),
  component: PersonalPage,
})
