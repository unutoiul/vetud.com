import { getFormatter } from "next-intl/server"
import { moneyFormat, type MoneyOptions } from "./money"

/** useMoney for async server components. */
export async function getMoney() {
  const format = await getFormatter()
  return (amount: number | null | undefined, currencyCode: string, options?: MoneyOptions) =>
    format.number(Number(amount ?? 0), moneyFormat(currencyCode, options))
}
