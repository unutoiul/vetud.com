"use client"

import CssBaseline from "@mui/material/CssBaseline"
import GlobalStyles from "@mui/material/GlobalStyles"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter"
import { useMemo, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { fontFaces } from "./fonts"
import { pepLabTheme } from "./pep-lab"
import SingleServerStyles from "./SingleServerStyles"

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const act = useTranslations("Actions")
  const theme = useMemo(
    () =>
      createTheme(pepLabTheme, {
        components: {
          MuiAutocomplete: {
            defaultProps: {
              clearText: act("clear"),
              closeText: act("close"),
              openText: act("open"),
              loadingText: act("loading"),
              noOptionsText: act("noOptions"),
            },
          },
          MuiAlert: { defaultProps: { closeText: act("close") } },
          MuiPagination: {
            defaultProps: {
              getItemAriaLabel: (type: string, page: number | null, selected: boolean) => {
                if (type === "page") return act(selected ? "currentPage" : "goToPage", { page: page ?? 1 })
                return act(
                  type === "first"
                    ? "firstPage"
                    : type === "last"
                      ? "lastPage"
                      : type === "next"
                        ? "nextPage"
                        : "previousPage",
                )
              },
            },
          },
        },
      }),
    [act],
  )
  return (
    <SingleServerStyles>
      <AppRouterCacheProvider options={{ key: "vetud", enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyles styles={fontFaces} />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </SingleServerStyles>
  )
}
