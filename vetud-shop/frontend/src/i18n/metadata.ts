import "server-only"
import type { Metadata } from "next"
import { countryCode } from "next/root-params"
import { parseStoreSegment } from "@/lib/store-segment"
import { getContentTranslator } from "./server-content"

export async function getPageLocalization() {
  const [segment, ct] = await Promise.all([countryCode(), getContentTranslator()])
  const country = parseStoreSegment(segment).country
  const locale = ct.locale
  const openGraphLocale = locale.includes("-") ? locale.replaceAll("-", "_") : `${locale}_${country.toUpperCase()}`
  return { country, locale, openGraphLocale, ct }
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
    ...(input.openGraph ? { openGraph: { ...input.openGraph, title: translateTitle(input.openGraph.title) ?? undefined, description: ct(input.openGraph.description), locale: openGraphLocale } } : {}),
    ...(input.twitter ? { twitter: { ...input.twitter, title: translateTitle(input.twitter.title) ?? undefined, description: ct(input.twitter.description) ?? undefined } } : {}),
  }
}
