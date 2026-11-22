"use client"

import { App, ConfigProvider } from "antd"
import enUS from "antd/locale/en_US"
import { theme } from "@/theme/tokens"
import { OrderProvider } from "./OrderProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme} locale={enUS}>
      <App>
        <OrderProvider>{children}</OrderProvider>
      </App>
    </ConfigProvider>
  )
}
