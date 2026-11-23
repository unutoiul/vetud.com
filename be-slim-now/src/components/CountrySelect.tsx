"use client"

import { Select } from "antd"
import type { DefaultOptionType } from "antd/es/select"
import Image from "next/image"
import { useMemo, type ReactNode } from "react"
import { DEFAULT_COUNTRY, MARKETS, MARKET_CODES, isMarket } from "@/config/markets"
import { COUNTRY_CODES } from "@/lib/countries"
import { currencyOf, pricingCountry } from "@/lib/pricing"
import { format } from "@/i18n/format"
import { colors, fonts } from "@/theme/tokens"
import { useCountry } from "./CountryProvider"
import { useMessages } from "./MessagesProvider"

/**
 * A small flag from public/flags (country-flag-icons, MIT; see LICENSE.txt there). Images, because
 * Windows shows flag emoji as two letters. Decorative: the name or currency always sits next to it.
 */
export function CountryFlag({ code, width = 20 }: { code: string; width?: number }) {
  const height = Math.round((width * 2) / 3)
  return (
    <Image
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden
      width={width}
      height={height}
      unoptimized
      style={{ display: "block", flex: "none", width, height, objectFit: "cover", borderRadius: 2, boxShadow: `0 0 0 1px ${colors.lineStrong}` }}
    />
  )
}

type CountryOption = {
  value: string
  /** English name, as on the rest of the page. */
  label: string
  /** The country's own name (Deutschland, Sverige…), when it differs. */
  native: string | null
  /** The currency its prices are in. */
  currency: string
  /** Everything a visitor might type, lower case and without accents. */
  search: string
}

type CountryGroup = { label: string; title: string; options: CountryOption[] }

/** Other names people type for a country. */
const ALIASES: Record<string, string> = {
  US: "usa america united states",
  GB: "uk britain great britain england scotland wales northern ireland",
  NL: "holland",
  CZ: "czech republic",
  MK: "macedonia",
  VA: "holy see vatican",
  BA: "bosnia herzegovina",
  AE: "uae emirates",
  KR: "korea",
}

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/**
 * The country list, grouped: the United States, then every European country, then (for the order
 * form) every other country we ship to, which pays US prices. Names come from Intl.DisplayNames:
 * English for the page, plus each picker country's name in its own language.
 */
type GroupNames = { us: string; europe: string; other: string; otherTitle: string }

function buildGroups(withOtherCountries: boolean, names: GroupNames): CountryGroup[] {
  const english = new Intl.DisplayNames(["en"], { type: "region" })
  const currencyNames = new Intl.DisplayNames(["en"], { type: "currency" })
  const toOption = (code: string): CountryOption => {
    const label = english.of(code) ?? code
    const own = isMarket(code) ? (new Intl.DisplayNames([MARKETS[code].locale], { type: "region" }).of(code) ?? label) : label
    const currency = currencyOf(pricingCountry(code))
    return {
      value: code,
      label,
      native: own !== label ? own : null,
      currency,
      search: fold([label, own, code, currency, currencyNames.of(currency), ALIASES[code]].filter(Boolean).join(" ")),
    }
  }
  const byName = (a: CountryOption, b: CountryOption) => a.label.localeCompare(b.label, "en")
  const groups: CountryGroup[] = [
    { label: names.us, title: names.us, options: [toOption(DEFAULT_COUNTRY)] },
    { label: names.europe, title: names.europe, options: MARKET_CODES.filter((code) => code !== DEFAULT_COUNTRY).map(toOption).sort(byName) },
  ]
  if (withOtherCountries) {
    const others = COUNTRY_CODES.filter((code) => !isMarket(code)).map(toOption).sort(byName)
    groups.push({ label: names.other, title: names.otherTitle, options: others })
  }
  return groups
}

/** The group headings come from countryPicker in the messages. */
export function useCountryGroups(withOtherCountries = false) {
  const t = useMessages().countryPicker
  return useMemo(
    () => buildGroups(withOtherCountries, { us: t.groupUs, europe: t.groupEurope, other: t.groupOther, otherTitle: t.groupOtherTitle }),
    [withOtherCountries, t.groupUs, t.groupEurope, t.groupOther, t.groupOtherTitle],
  )
}

/**
 * Search by English or own name, ISO code, currency or a common alias ("uk", "usa", "holland").
 * Matches the start of a word, so "can" finds Canada, not Vatican City.
 */
export const filterCountry = (input: string, option?: DefaultOptionType) =>
  typeof option?.search === "string" && ` ${option.search}`.includes(` ${fold(input.trim())}`)

/** One row in a country list: flag, name, own name, currency. */
export function renderCountryOption(option: { data: unknown }): ReactNode {
  const data = option.data as CountryOption
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <CountryFlag code={data.value} />
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        {data.label}
        {data.native && <span style={{ color: colors.muted, marginLeft: 6, fontSize: 13 }}>{data.native}</span>}
      </span>
      <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>{data.currency}</span>
    </span>
  )
}

/**
 * The country picker in the header: the United States and every European country, each with its
 * flag, its own name and the currency its prices are in. Choosing one changes every price on the
 * page at once and is remembered for the next visit.
 */
export default function CountrySelect({ compact = false, size = "middle" }: { compact?: boolean; size?: "middle" | "large" }) {
  const { country, currency, setCountry } = useCountry()
  const t = useMessages().countryPicker
  const groups = useCountryGroups()

  return (
    <Select<string>
      value={country}
      onChange={(code) => {
        if (isMarket(code)) setCountry(code)
      }}
      options={groups}
      size={size}
      aria-label={format(t.aria, { country, currency })}
      showSearch={{ filterOption: filterCountry }}
      placement="bottomRight"
      popupMatchSelectWidth={300}
      listHeight={360}
      style={{ width: compact ? 66 : 112 }}
      labelRender={() => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, verticalAlign: "middle" }}>
          <CountryFlag code={country} />
          {!compact && <span style={{ fontFamily: fonts.mono, fontSize: 13, fontWeight: 500, letterSpacing: "0.06em", color: colors.navyInk }}>{currency}</span>}
        </span>
      )}
      optionRender={renderCountryOption}
      popupRender={(menu) => (
        <>
          <div style={{ padding: "6px 12px 8px", fontSize: 12, color: colors.muted }}>{t.hint}</div>
          {menu}
        </>
      )}
    />
  )
}
