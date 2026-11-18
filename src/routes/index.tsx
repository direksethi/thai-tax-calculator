import { createFileRoute, redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"

const preferredLang = createServerFn({ method: "GET" }).handler(() => {
  const header = getRequestHeader("accept-language") ?? ""
  return /^\s*th\b/i.test(header) ? "th" : "en"
})

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const lang = typeof window === "undefined" ? await preferredLang() : window.navigator.language.toLowerCase().startsWith("th") ? "th" : "en"
    throw redirect({ to: "/$lang", params: { lang } })
  },
})
