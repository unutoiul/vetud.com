"use client"

import CssBaseline from "@mui/material/CssBaseline"
import { ThemeProvider } from "@mui/material/styles"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import type { ReactNode } from "react"
import { pepLabTheme } from "./pep-lab"

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "vetud", enableCssLayer: true }}>
      <ThemeProvider theme={pepLabTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  )
}
