import { useFormatter, useLocale, type NumberFormatOptions } from "next-intl"

/** `whole` drops the decimals, e.g. for "free shipping over £170". */
export type MoneyOptions = { whole?: boolean }

/** Intl currency options; Intl knows each currency's symbol and decimals (2 for EUR, 0 for JPY). */
export function moneyFormat(currencyCode: string, { whole = false }: MoneyOptions = {}): NumberFormatOptions {
  return { style: "currency", currency: currencyCode.toUpperCase(), ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) }
}

/** Some browsers lack Icelandic ICU data. These separators and ISO codes match Icelandic store prices. */
export function icelandicMoney(amount: number, currencyCode: string, options?: MoneyOptions) {
  return new Intl.NumberFormat("da-DK", { ...moneyFormat(currencyCode, options), currencyDisplay: "code" }).format(amount)
}

/**
 * Formats amounts with next-intl in the page's locale, in whatever currency Medusa gives:
 * "$58.00" on /us, "51,64 €" on /de. Server components that are async use getMoney instead.
 */
export function useMoney() {
  const format = useFormatter()
  const locale = useLocale()
  return (amount: number | null | undefined, currencyCode: string, options?: MoneyOptions) =>
    locale.startsWith("is") ? icelandicMoney(Number(amount ?? 0), currencyCode, options)
      : format.number(Number(amount ?? 0), moneyFormat(currencyCode, options))
}
