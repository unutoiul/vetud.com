"use client"

import { createContext, useContext, type ReactNode } from "react"
import { DEFAULT_LANGUAGE, type Language } from "@/i18n/languages"

const LanguageContext = createContext<Language>(DEFAULT_LANGUAGE)

export function LanguageProvider({ language, children }: { language: Language; children: ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>
}

/** Comes from the root layout, not URL hooks, so links never block prerendering. */
export const useLanguage = () => useContext(LanguageContext)
