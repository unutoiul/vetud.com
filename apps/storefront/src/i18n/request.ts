import { countryCode } from "next/root-params"
import { getRequestConfig } from "next-intl/server"
import { parseStoreSegment } from "@/lib/store-segment"
import { getCountryI18n } from "./server-config"

// Country URLs determine the locale; never infer language from the currency ("se-usd" is still Swedish).
export default getRequestConfig(async () => getCountryI18n(parseStoreSegment(await countryCode()).country))
