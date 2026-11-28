"use client"

import { Input, Select, Space } from "antd"
import type { DefaultOptionType } from "antd/es/select"
import { useEffect, useMemo, useRef, useState } from "react"
import { COUNTRY_CODES, DIAL_CODES, PHONE_EXAMPLES, countryName } from "@/lib/countries"
import { colors, fonts } from "@/theme/tokens"
import { CountryFlag } from "./CountrySelect"

type DialOption = { value: string; label: string; dial: string; search: string }

const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

/** Search by country name, ISO code or calling code ("44", "+44", "uk"…). */
const filterDial = (input: string, option?: DefaultOptionType) => {
  const query = fold(input.trim()).replace(/^\+/, "")
  return typeof option?.search === "string" && ` ${option.search}`.includes(` ${query}`)
}

/**
 * The phone number: a calling-code picker with flags, then the number itself. The code follows the
 * Ship to country until the visitor picks one, and the value the form gets is "+<code> <number>"
 * (a number typed with its own "+…" or "00…" is kept as typed).
 */
export default function PhoneField({
  id,
  value = "",
  onChange,
  country,
  placeholder,
  codeLabel,
  maxLength,
}: {
  id?: string
  value?: string
  onChange?: (value: string) => void
  /** The Ship to country, which sets the code until the visitor picks one. */
  country: string
  placeholder: string
  codeLabel: string
  maxLength?: number
}) {
  const [dialCountry, setDialCountry] = useState(DIAL_CODES[country] ? country : "US")
  const picked = useRef(false)

  const prefix = (code: string) => `+${DIAL_CODES[code]} `
  const number = value.startsWith(prefix(dialCountry)) ? value.slice(prefix(dialCountry).length) : value
  const compose = (code: string, typed: string) =>
    !typed ? "" : /^\s*(\+|00)/.test(typed) ? typed : `${prefix(code)}${typed}`

  const switchTo = (code: string) => {
    setDialCountry(code)
    if (number) onChange?.(compose(code, number))
  }

  // Follow the Ship to country until the visitor chooses a code.
  useEffect(() => {
    if (!picked.current && DIAL_CODES[country] && country !== dialCountry) switchTo(country)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new Ship to country should move the code
  }, [country])

  const options = useMemo<DialOption[]>(
    () =>
      COUNTRY_CODES.map((code) => {
        const label = countryName(code)
        return {
          value: code,
          label,
          dial: DIAL_CODES[code],
          search: fold(`${label} ${code} ${DIAL_CODES[code]}${code === "GB" ? " uk" : code === "US" ? " usa" : ""}`),
        }
      }).sort((a, b) => a.label.localeCompare(b.label, "en")),
    [],
  )

  return (
    <Space.Compact block>
      <Select<string>
        value={dialCountry}
        onChange={(code) => {
          picked.current = true
          switchTo(code)
        }}
        options={options}
        aria-label={codeLabel}
        showSearch={{ filterOption: filterDial }}
        popupMatchSelectWidth={280}
        listHeight={300}
        style={{ width: 104, flex: "none" }}
        labelRender={() => (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle" }}>
            <CountryFlag code={dialCountry} width={18} />
            <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.navyInk }}>
              +{DIAL_CODES[dialCountry]}
            </span>
          </span>
        )}
        optionRender={(option) => {
          const data = option.data as DialOption
          return (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CountryFlag code={data.value} />
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{data.label}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.muted }}>+{data.dial}</span>
            </span>
          )
        }}
      />
      <Input
        id={id}
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        value={number}
        onChange={(event) => onChange?.(compose(dialCountry, event.target.value))}
        placeholder={PHONE_EXAMPLES[dialCountry] ?? placeholder}
        maxLength={maxLength}
      />
    </Space.Compact>
  )
}
