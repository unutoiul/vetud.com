import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = { robots: { index: false, follow: true } }

/** The retired packaging page must not advertise formats no longer offered. */
export default function RetiredPenPage({ params }: PageProps<"/[countryCode]/dual-chamber-pen">) {
  return <Suspense fallback={null}><CurrentCatalog params={params} /></Suspense>
}

async function CurrentCatalog({ params }: Pick<PageProps<"/[countryCode]/dual-chamber-pen">, "params">): Promise<never> {
  const { countryCode } = await params
  return redirect(`/${encodeURIComponent(countryCode)}/shop`)
}
