import { Link } from "@tanstack/react-router"
import { useLang } from "@/lib/i18n"

export function NotFound() {
  const lang = useLang()
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-3 px-6 py-32">
      <p className="num text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">{lang === "en" ? "Page not found" : "ไม่พบหน้านี้"}</h1>
      <Link to="/$lang" params={{ lang }} className="text-sm text-ink underline-offset-4 hover:underline">
        {lang === "en" ? "Open the personal tax calculator" : "เปิดเครื่องคำนวณภาษีบุคคล"}
      </Link>
    </div>
  )
}
