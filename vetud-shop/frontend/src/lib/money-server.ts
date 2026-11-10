import { getFormatter, getLocale } from "next-intl/server"
import { icelandicMoney, moneyFormat, type MoneyOptions } from "./money"

/** useMoney for async server components. */
export async function getMoney() {
  const [format, locale] = await Promise.all([getFormatter(), getLocale()])
  return (amount: number | null | undefined, currencyCode: string, options?: MoneyOptions) =>
    locale.startsWith("is") ? icelandicMoney(Number(amount ?? 0), currencyCode, options)
      : format.number(Number(amount ?? 0), moneyFormat(currencyCode, options))
}
