import { createFileRoute, redirect } from "@tanstack/react-router"
import { SignInPage } from "@/features/account/sign-in-page"
import { pageHead } from "@/lib/seo"
import { getAccountsEnabled } from "@/server/returns"

export const Route = createFileRoute("/$lang/sign-in")({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({ next: typeof search.next === "string" ? search.next : undefined }),
  beforeLoad: async ({ params }) => {
    if (!(await getAccountsEnabled())) throw redirect({ to: "/$lang", params: { lang: params.lang }, search: {} })
  },
  head: ({ params }) => pageHead(params, "/sign-in", { en: "Sign in", th: "เข้าสู่ระบบ" }, { en: "Sign in to save your Thai tax returns.", th: "เข้าสู่ระบบเพื่อบันทึกแบบภาษีของคุณ" }),
  component: SignInPage,
})
