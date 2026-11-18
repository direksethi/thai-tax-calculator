import { Outlet, createFileRoute, notFound } from "@tanstack/react-router"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteHeader } from "@/components/site/site-header"
import { isLang } from "@/lib/i18n"
import { getAccountsEnabled } from "@/server/returns"

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound()
  },
  // Read once per visit; see useAccountsEnabled.
  loader: async () => ({ accounts: await getAccountsEnabled() }),
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  component: LangLayout,
})

function LangLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
