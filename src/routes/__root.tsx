import { HeadContent, Scripts, createRootRoute, useParams } from "@tanstack/react-router"
import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NotFound } from "@/components/site/not-found"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#fafaf7" },
      { name: "color-scheme", content: "light" },
      { property: "og:site_name", content: "Thai Tax Calculator" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const params = useParams({ strict: false }) as { lang?: string }
  const lang = params.lang === "th" ? "th" : "en"
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh">
        <TooltipProvider>{children}</TooltipProvider>
        <Scripts />
      </body>
    </html>
  )
}
