import { countryCode } from "next/root-params"
import { getRequestConfig } from "next-intl/server"
import { getCountryI18n } from "./config"

// Country URLs determine the locale; never infer language from the currency.
export default getRequestConfig(async () => getCountryI18n(await countryCode()))
