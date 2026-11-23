import Script from "next/script"
import { CLARITY_ID, GA_ID, clarityBootstrap, gaBootstrap } from "@/lib/analytics"

/** Google Analytics and Microsoft Clarity, each only when its ID is set (see src/lib/analytics.ts). */
export default function Analytics() {
  return (
    <>
      {GA_ID && (
        <>
          <Script id="ga-init" strategy="afterInteractive">
            {gaBootstrap()}
          </Script>
          <Script id="ga-tag" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        </>
      )}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="lazyOnload">
          {clarityBootstrap()}
        </Script>
      )}
    </>
  )
}
