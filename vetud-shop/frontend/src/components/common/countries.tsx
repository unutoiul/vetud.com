"use client"

import Box from "@mui/material/Box"
import type { PopperProps } from "@mui/material/Popper"
import { useLocale } from "next-intl"
import { useMemo, type HTMLAttributes, type Key, type ReactNode } from "react"
import CountryFlag from "./CountryFlag"

/**
 * Shared by every country picker (the address country, the phone calling code): the same names,
 * flags, search and rows, so they look and behave alike.
 */
export type CountryChoice = {
  /** Lower-case ISO code, as Medusa stores it ("gb"). */
  code: string
  /** The country's name in the visitor's language. */
  label: string
  /** Calling code without "+", for phone pickers ("44"). */
  dial?: string
  /** The main country of a calling code shared by several (US for +1, GB for +44). */
  main?: boolean
}

/** Other names people type for a country. */
const ALIASES: Record<string, string> = {
  gb: "UK GB Britain England Scotland Wales",
  us: "USA US America",
  ae: "UAE Emirates Dubai",
  nl: "Holland",
  cz: "Czech Republic",
  ch: "Swiss Suisse Schweiz",
  de: "Deutschland",
  es: "España Espana",
  kr: "South Korea",
}

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

/** Countries with names in the visitor's language, sorted for that language. */
export function useCountryChoices(countries: { code: string; dial?: string; main?: boolean }[]): CountryChoice[] {
  const locale = useLocale()
  return useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" })
    return countries
      .map(({ code, dial, main }) => ({ code: code.toLowerCase(), label: names.of(code.toUpperCase()) ?? code.toUpperCase(), dial, main }))
      .sort((a, b) => a.label.localeCompare(b.label, locale))
  }, [countries, locale])
}

/**
 * Search by name (in the visitor's language, accents optional), ISO code or another common name
 * ("uk", "usa"), or by calling code ("+44", "44"). Exact matches come first.
 */
export function filterCountryChoices(options: CountryChoice[], { inputValue }: { inputValue: string }) {
  const query = normalize(inputValue.trim())
  if (!query) return options
  const digits = query.replace(/^\+/, "").replace(/[\s().-]/g, "")
  if (/^\d+$/.test(digits)) {
    const rank = (option: CountryChoice) => (option.dial === digits ? (option.main ? 0 : 1) : 2)
    return options.filter((option) => option.dial?.startsWith(digits)).sort((a, b) => rank(a) - rank(b))
  }
  const rank = (option: CountryChoice) => {
    const label = normalize(option.label)
    const aliases = normalize(ALIASES[option.code] ?? "").split(/\s+/)
    if (option.code === query || aliases.includes(query)) return 0
    if (label.startsWith(query)) return 1
    return label.split(/[\s-]+/).some((word) => word.startsWith(query)) ? 2 : 3
  }
  return options
    .filter((option) => `${normalize(option.label)} ${option.code} ${normalize(ALIASES[option.code] ?? "")}`.includes(query))
    .sort((a, b) => rank(a) - rank(b))
}

/** One row in a country list: flag, name, and the calling code when there is one. */
export function CountryChoiceRow({ choice }: { choice: CountryChoice }) {
  return <>
    <CountryFlag code={choice.code} />
    <Box component="span" sx={{ flex: 1, minWidth: 0 }}>{choice.label}</Box>
    {choice.dial ? <Box component="span" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", pl: 1.5 }}>+{choice.dial}</Box> : null}
  </>
}

/** `renderOption` for an Autocomplete of countries. */
export function renderCountryOption({ key, ...props }: HTMLAttributes<HTMLLIElement> & { key: Key }, choice: CountryChoice) {
  return <Box component="li" key={key} {...props} sx={{ gap: 1.25, minHeight: 44 }}><CountryChoiceRow choice={choice} /></Box>
}

/**
 * An Autocomplete list shown in place rather than floating, for a search box inside a popover.
 * It drops the positioning props Autocomplete gives its popper.
 */
export function InlineCountryList(allProps: PopperProps & { ownerState?: unknown }) {
  const { open, style, children, className, role, id } = allProps
  if (!open) return null
  return <div className={className} role={role} id={id} style={{ ...style, position: "relative", width: "100%" }}>{children as ReactNode}</div>
}
