import { lang } from "next/root-params"
import { getRequestConfig } from "next-intl/server"
import { asLanguage } from "./languages"
import { getLanguageI18n } from "./server-config"

export default getRequestConfig(async () => getLanguageI18n(asLanguage(await lang())))
