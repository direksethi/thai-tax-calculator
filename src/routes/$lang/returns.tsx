import { createFileRoute, redirect } from "@tanstack/react-router"
import { ReturnsPage } from "@/features/account/returns-page"
import { pageHead } from "@/lib/seo"
import { getAccountsEnabled } from "@/server/returns"

export const Route = createFileRoute("/$lang/returns")({
  beforeLoad: async ({ params }) => {
    if (!(await getAccountsEnabled())) throw redirect({ to: "/$lang", params: { lang: params.lang }, search: {} })
  },
  head: ({ params }) => pageHead(params, "/returns", { en: "Saved returns", th: "แบบที่บันทึกไว้" }, { en: "Your saved Thai tax returns.", th: "แบบภาษีที่คุณบันทึกไว้" }),
  component: ReturnsPage,
})
