import { createFileRoute } from "@tanstack/react-router"
import { CompanyPage } from "@/features/company/company-page"
import { pageHead } from "@/lib/seo"

export const Route = createFileRoute("/$lang/company")({
  validateSearch: (search: Record<string, unknown>): { return?: string } => ({ return: typeof search.return === "string" ? search.return : undefined }),
  head: ({ params }) =>
    pageHead(
      params,
      "/company",
      { en: "Company or personal: Thai tax comparison", th: "จดบริษัทหรือรับเงินในนามบุคคล เปรียบเทียบภาษี" },
      {
        en: "Compare earning as a person with running the same work through a Thai company: optimal salary, dividends and credit, SME corporate tax, running costs and filings.",
        th: "เปรียบเทียบการรับเงินในนามบุคคลกับการจดบริษัท เงินเดือนที่เหมาะสม เงินปันผลและเครดิตภาษี ภาษีนิติบุคคล SME ค่าใช้จ่ายและแบบที่ต้องยื่น",
      },
    ),
  component: CompanyPage,
})
