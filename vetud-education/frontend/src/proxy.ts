import { NextResponse, type NextRequest } from "next/server"
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE, type Language } from "./i18n/languages"

const SECTIONS = new Set(["learn", "news", "videos", "community", "contact", "account", "legal", "newsletter"])

function preferredLanguage(request: NextRequest): Language {
  const saved = request.cookies.get(LANGUAGE_COOKIE)?.value
  if (isLanguage(saved)) return saved
  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0]?.split("-")[0]?.trim().toLowerCase())
  return accepted.find(isLanguage) ?? DEFAULT_LANGUAGE
}

/**
 * Every page lives under its language (/en/learn, /fr/learn). The site doesn't depend on the visitor's
 * country, so no backend call or cookie is needed here. Old country addresses are handled in
 * next.config.ts, which runs first.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const first = pathname.split("/")[1]?.toLowerCase()
  if (isLanguage(first)) return NextResponse.next()

  const url = request.nextUrl.clone()
  if (pathname === "/") {
    url.pathname = `/${preferredLanguage(request)}`
    return NextResponse.redirect(url, 307)
  }
  url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
  // Known sections move to their language; anything else renders this site's 404 page.
  return SECTIONS.has(first ?? "") ? NextResponse.redirect(url, 308) : NextResponse.rewrite(url)
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|google[a-f0-9]+\\.html$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|mp4)$).*)",
  ],
}
