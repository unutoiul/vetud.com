"use client"

import { App, ConfigProvider } from "antd"
import enUS from "antd/locale/en_US"
import { theme } from "@/theme/tokens"

/** Ant Design's theme and message API. The country and order providers sit in Storefront, inside these. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <App>{children}</App>
    </ConfigProvider>
  )
}
