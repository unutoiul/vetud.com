import type { Metadata } from "next"
import { Suspense } from "react"
import { colors } from "@/theme/tokens"
import UnsubscribeForm from "./UnsubscribeForm"

export const metadata: Metadata = {
  title: "Unsubscribe · BeSlimNow",
  robots: { index: false, follow: false },
}

/** Where "Unsubscribe" at the bottom of every customer email leads (owner request 2026-11-28). */
export default function UnsubscribePage() {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px 16px", color: colors.navyInk }}>
      <Suspense fallback={null}>
        <UnsubscribeForm />
      </Suspense>
    </main>
  )
}
