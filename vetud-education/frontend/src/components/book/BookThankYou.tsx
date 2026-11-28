"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { SITE } from "@/lib/config"
import { AppLink } from "../common/links"
import { BOOK, bookOrder } from "./book"
import BookCover from "./BookCover"
import { bookPanelSx } from "./panel"

type State =
  { status: "checking" } | { status: "paid"; email: string | null } | { status: "unpaid" } | { status: "error" }

const stepSx = {
  display: "grid",
  gridTemplateColumns: "28px minmax(0, 1fr)",
  gap: 1,
  color: "brand.onNavyMuted",
  fontSize: 15,
  lineHeight: 1.6,
}
const numberSx = { color: "brand.cyan", fontWeight: 700 }

/**
 * Where Stripe sends a buyer back after paying. It checks the payment with our server and tells them
 * the download link is on its way by email (sent by our server from Stripe's webhook).
 */
export default function BookThankYou() {
  const ct = useContentTranslator()
  const sessionId = useSearchParams().get("session_id") ?? ""
  const [state, setState] = useState<State>({ status: sessionId ? "checking" : "unpaid" })

  useEffect(() => {
    if (!sessionId) return
    let live = true
    bookOrder(sessionId)
      .then((order) => {
        if (!live) return
        setState(order.paid ? { status: "paid", email: order.email } : { status: "unpaid" })
      })
      .catch(() => {
        if (live) setState({ status: "error" })
      })
    return () => {
      live = false
    }
  }, [sessionId])

  return (
    <Box sx={bookPanelSx}>
      <BookCover
        alt={ct("Peptides Explained: 32 peptides explained in detail")}
        sizes="(min-width: 900px) 240px, 190px"
        priority
        sx={{ maxWidth: { xs: 150, sm: "none" } }}
      />
      <Box role="status" aria-live="polite" sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "brand.cyan", fontSize: 13, fontWeight: 600 }}>{BOOK.title}</Typography>
        {state.status === "checking" ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2, color: "brand.onNavyMuted" }}>
            <CircularProgress size={20} color="inherit" />
            <Typography>{ct("Checking your payment...")}</Typography>
          </Box>
        ) : state.status === "paid" ? (
          <>
            <Typography
              variant="h2"
              sx={{ mt: 1, fontSize: { xs: 30, sm: 38 }, lineHeight: 1.08, letterSpacing: "-.05em" }}
            >
              {ct("Thank you. Check your email.")}
            </Typography>
            <Typography sx={{ mt: 1.5, color: "brand.onNavyMuted", fontSize: 16, lineHeight: 1.6 }}>
              {ct("We're emailing you the link to download your book")}
              {state.email ? (
                <>
                  {" "}
                  {ct("to")}{" "}
                  <Box component="strong" sx={{ color: "brand.onNavy", overflowWrap: "anywhere" }}>
                    {state.email}
                  </Box>
                </>
              ) : null}
              .
            </Typography>
            <Box component="ol" sx={{ listStyle: "none", p: 0, m: "20px 0 0", display: "grid", gap: 1 }}>
              <Box component="li" sx={stepSx}>
                <Box component="span" sx={numberSx}>
                  1
                </Box>
                {ct('Open the email "Your book is ready: Peptides Explained". It usually arrives within a minute.')}
              </Box>
              <Box component="li" sx={stepSx}>
                <Box component="span" sx={numberSx}>
                  2
                </Box>
                {ct(
                  'Press "Open your book": it opens the book\'s Google Drive folder, where you can download the PDF.',
                )}
              </Box>
              <Box component="li" sx={stepSx}>
                <Box component="span" sx={numberSx}>
                  3
                </Box>
                {ct("Keep the email: the link works again whenever you need it.")}
              </Box>
            </Box>
            <Typography sx={{ mt: 2.5, color: "brand.onNavyMuted", fontSize: 13, lineHeight: 1.6 }}>
              {ct.template(
                "Nothing after 10 minutes? Check your spam folder, or write to {v0} and we'll send it again. Your receipt comes separately from Stripe.",
                { v0: SITE.email },
                { translateValues: false },
              )}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant="h2"
              sx={{ mt: 1, fontSize: { xs: 28, sm: 34 }, lineHeight: 1.1, letterSpacing: "-.05em" }}
            >
              {ct("We couldn't find a payment for this link.")}
            </Typography>
            {state.status === "error" ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {ct("We couldn't check your payment just now. Please reload this page in a minute.")}
              </Alert>
            ) : null}
            <Typography sx={{ mt: 2, color: "brand.onNavyMuted", fontSize: 15, lineHeight: 1.6 }}>
              {ct.template(
                "If you have paid, write to {v0} with the email you used and we'll send you the book.",
                { v0: SITE.email },
                { translateValues: false },
              )}{" "}
              <AppLink href="/contact" sx={{ color: "brand.cyan" }}>
                {ct("Contact us")}
              </AppLink>
            </Typography>
          </>
        )}
      </Box>
    </Box>
  )
}
