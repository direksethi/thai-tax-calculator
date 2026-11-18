import type { L } from "./i18n"
import { isLang } from "./i18n"

/**
 * The public origin of the deployed site, for example https://tax.example.com.
 * Set VITE_SITE_URL at build time. Without it the canonical, alternate-language
 * and og:url tags are left out, since they must be absolute URLs.
 */
const ORIGIN = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").replace(/\/+$/, "")

/** Title, description and alternate-language links for one page. */
export function pageHead(params: { lang: string }, path: string, title: L, description: L) {
  const lang = isLang(params.lang) ? params.lang : "en"
  const fullTitle = `${title[lang]} · ${lang === "en" ? "Thai Tax Calculator" : "คำนวณภาษีไทย"}`
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description[lang] },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description[lang] },
      ...(ORIGIN ? [{ property: "og:url", content: `${ORIGIN}/${lang}${path}` }] : []),
      { property: "og:locale", content: lang === "en" ? "en_US" : "th_TH" },
    ],
    links: ORIGIN
      ? [
          { rel: "canonical", href: `${ORIGIN}/${lang}${path}` },
          { rel: "alternate", hrefLang: "en", href: `${ORIGIN}/en${path}` },
          { rel: "alternate", hrefLang: "th", href: `${ORIGIN}/th${path}` },
          { rel: "alternate", hrefLang: "x-default", href: `${ORIGIN}/en${path}` },
        ]
      : [],
  }
}
