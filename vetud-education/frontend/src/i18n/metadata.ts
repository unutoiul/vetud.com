import "server-only"
import type { Metadata } from "next"
import { SHARE_IMAGE } from "@/lib/config"
import { lang } from "next/root-params"
import { asLanguage, type Language } from "./languages"
import { getContentTranslator } from "./server-content"

const OPEN_GRAPH_LOCALES: Record<Language, string> = {
  en: "en_US", es: "es_ES", pt: "pt_BR", fr: "fr_FR", de: "de_DE", it: "it_IT", nl: "nl_NL", pl: "pl_PL",
}

export async function getPageLocalization() {
  const [segment, ct] = await Promise.all([lang(), getContentTranslator()])
  const language = asLanguage(segment)
  return { language, locale: ct.locale, openGraphLocale: OPEN_GRAPH_LOCALES[language], ct }
}

/** Localize readable metadata without changing URL targets, identifiers, or robot directives. */
export async function localizeMetadata(input: Metadata): Promise<Metadata> {
  const { ct, openGraphLocale } = await getPageLocalization()
  const translateTitle = (value: Metadata["title"]): Metadata["title"] => {
    if (typeof value === "string") return ct(value)
    if (!value) return value
    return { ...value, ...("default" in value ? { default: ct(value.default) } : {}), ...("absolute" in value ? { absolute: ct(value.absolute) } : {}) }
  }
  return {
    ...input, title: translateTitle(input.title), description: ct(input.description),
    ...(input.openGraph ? { openGraph: { images: [SHARE_IMAGE], ...input.openGraph, title: translateTitle(input.openGraph.title) ?? undefined, description: ct(input.openGraph.description), locale: openGraphLocale } } : {}),
    ...(input.twitter ? { twitter: { ...input.twitter, title: translateTitle(input.twitter.title) ?? undefined, description: ct(input.twitter.description) ?? undefined } } : {}),
  }
}
