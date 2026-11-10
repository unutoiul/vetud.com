"use client"

import Box from "@mui/material/Box"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { LANGUAGE_COOKIE, LANGUAGE_NAMES, LANGUAGES, type Language } from "@/i18n/languages"
import { useLanguage } from "../common/language"

function remember(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`
}

function Links({ rest }: { rest: string }) {
  const current = useLanguage()
  return <Box component="ul" sx={{ display: "flex", gap: .25, m: 0, p: 0, listStyle: "none" }}>
    {LANGUAGES.map((language) => <li key={language}>
      {/* A full page load, so the whole page is rendered in the new language. */}
      <Box
        component="a"
        href={`/${language}${rest}`}
        hrefLang={language}
        lang={language}
        title={LANGUAGE_NAMES[language]}
        aria-label={LANGUAGE_NAMES[language]}
        aria-current={language === current ? "true" : undefined}
        onClick={() => remember(language)}
        sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 36, minHeight: 44, px: .75, fontSize: 13, fontWeight: language === current ? 700 : 500, textDecoration: "none", color: language === current ? "brand.blue" : "brand.navySoft", textTransform: "uppercase", "&:hover": { color: "brand.blue" } }}
      >
        {language}
      </Box>
    </li>)}
  </Box>
}

function CurrentPageLinks() {
  return <Links rest={usePathname().replace(/^\/[a-z]{2}(?=\/|$)/, "")} />
}

/** Links to this page in each language. The current address needs a URL hook, so it sits in Suspense. */
export default function LanguageSwitcher() {
  if (LANGUAGES.length < 2) return null
  return <Suspense fallback={<Links rest="" />}><CurrentPageLinks /></Suspense>
}
