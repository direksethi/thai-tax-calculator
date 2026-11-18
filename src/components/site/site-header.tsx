import { Link, useLocation } from "@tanstack/react-router"
import { cn } from "@/lib/utils"
import { AccountMenu } from "./account-menu"
import { useLang, type L } from "@/lib/i18n"

const NAV: { to: "/$lang" | "/$lang/company" | "/$lang/forms" | "/$lang/rules"; label: L }[] = [
  { to: "/$lang", label: { en: "Personal tax", th: "ภาษีบุคคล" } },
  { to: "/$lang/company", label: { en: "Company or personal", th: "บริษัทหรือบุคคล" } },
  { to: "/$lang/forms", label: { en: "Forms", th: "แบบฟอร์ม" } },
  { to: "/$lang/rules", label: { en: "Rules", th: "หลักเกณฑ์" } },
]

export function SiteHeader() {
  const lang = useLang()
  const location = useLocation()
  const other = lang === "en" ? "th" : "en"
  const switchedPath = location.pathname.replace(/^\/(en|th)(?=\/|$)/, `/${other}`)

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/$lang" params={{ lang }} className="flex shrink-0 items-center gap-2.5" aria-label="Thai Tax Calculator">
          <Mark />
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            {lang === "en" ? "Thai Tax Calculator" : "คำนวณภาษีไทย"}
          </span>
        </Link>
        <nav className="-mx-1 hidden items-center gap-0.5 md:flex" aria-label={lang === "en" ? "Main" : "เมนูหลัก"}>
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ lang }}
              activeOptions={{ exact: true }}
              className="rounded-md px-2.5 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground"
            >
              {item.label[lang]}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={switchedPath + location.searchStr}
            hrefLang={other}
            className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {other === "th" ? "ไทย" : "English"}
          </a>
          <AccountMenu />
        </div>
      </div>
      <nav
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 md:hidden [scrollbar-width:none]"
        aria-label={lang === "en" ? "Main" : "เมนูหลัก"}
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            params={{ lang }}
            activeOptions={{ exact: true }}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[13px] text-muted-foreground",
              "data-[status=active]:bg-secondary data-[status=active]:font-medium data-[status=active]:text-foreground",
            )}
          >
            {item.label[lang]}
          </Link>
        ))}
      </nav>
    </header>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <path d="M9 11h14M9 16h9M9 21h11" className="stroke-primary-foreground" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23" cy="21" r="2.2" className="fill-ink" />
    </svg>
  )
}
