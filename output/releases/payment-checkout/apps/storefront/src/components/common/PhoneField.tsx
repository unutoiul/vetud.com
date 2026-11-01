"use client"

import TextField from "@mui/material/TextField"
import { useTranslations } from "next-intl"
import { getCountryRules } from "@/i18n/config"
import { normalizePhone } from "@/lib/address"

export default function PhoneField({ country, value, onChange, error, id = "phone", name = "phone", autoComplete = "tel" }: {
  country: string; value: string; onChange: (value: string) => void; error?: string; id?: string; name?: string; autoComplete?: string
}) {
  const t = useTranslations("Address")
  const rules = getCountryRules(country)
  return <TextField id={id} name={name} type="tel" label={t("phone")} value={value} onChange={event => onChange(event.target.value)} onBlur={() => onChange(normalizePhone(value, country))} error={Boolean(error)} helperText={error || t("phoneHelp")} placeholder={`+${rules.callingCode}`} slotProps={{ htmlInput: { autoComplete, inputMode: "tel" } }} />
}
