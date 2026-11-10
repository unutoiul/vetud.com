import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import { DownloadIcon } from "@/components/brand/Icon"
import Skeleton from "@mui/material/Skeleton"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import LotLookup from "@/components/documentation/LotLookup"
import { AppLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listProducts } from "@/lib/medusa/products"
import { readProductMeta } from "@/lib/product"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Lot documentation",
  description: "Look up any Vetud lot number to see its batch date, purity result and certificate of analysis.",
})
}

export default async function DocumentationPage() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const { region } = await getCurrentRegion()
  const products = await listProducts({ regionId: region.id })
  const rows = products
    .flatMap((product) => {
      const meta = readProductMeta(product)
      return meta.lots.map((lot) => ({ product, meta, lot }))
    })
    .sort((a, b) => (b.lot.date ?? "").localeCompare(a.lot.date ?? "") || a.lot.lot.localeCompare(b.lot.lot))

  return (
    <>
      <PageHeader
        eyebrow={ct("Documentation")}
        title={ct("Every lot, on the record.")}
        description={ct("Enter the lot number printed on your packaging to find a published batch record. Request any additional analytical documentation from our team.")}
      />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={56} sx={{ maxWidth: 640 }} />}>
          <LotLookup />
        </Suspense>
      </Section>
      <Section tone="paper">
        <SectionHeading
          eyebrow={ct.template("Lot register · {v0} lots", { v0: rows.length })}
          title={ct("Current and recent batches.")}
          description={ct("Lots currently in circulation across the catalog, newest first.")}
        />
        <Box sx={{ overflowX: "auto", bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <Table aria-label={ct("Lot register")}>
            <TableHead>
              <TableRow>
                <TableCell scope="col">{act("lot")}</TableCell>
                <TableCell scope="col">{ct("Product")}</TableCell>
                <TableCell scope="col">{ct("Batch date")}</TableCell>
                <TableCell scope="col">{ct("Purity")}</TableCell>
                <TableCell scope="col" align="right">{ct("Certificate")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ product, meta, lot }) => (
                <TableRow key={`${product.id}-${lot.lot}`} hover>
                  <TableCell sx={{ fontFamily: "var(--font-dm-mono), monospace", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {lot.lot}
                  </TableCell>
                  <TableCell>
                    <AppLink href={`/products/${product.handle}`}>{ct(product.title)}</AppLink>
                    <Typography variant="mono" component="span" sx={{ color: "text.secondary", ml: 1, fontSize: 11 }}>
                      {ct(meta.code)}
                    </Typography>
                  </TableCell>
                  <TableCell>{ct(lot.date ?? "—")}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>{ct(lot.purity ?? "—")}</TableCell>
                  <TableCell align="right">
                    {lot.coaUrl ? (
                      <Box component="a" href={lot.coaUrl} target="_blank" rel="noopener" sx={{ display: "inline-flex", gap: 0.75, alignItems: "center", color: "secondary.main", fontWeight: 600 }}>
                        <DownloadIcon sx={{ fontSize: 17 }} /> {act("downloadCoa")}
                      </Box>
                    ) : (
                      <AppLink href={`/contact?subject=${encodeURIComponent(`COA request: ${lot.lot}`)}`}>{act("request")}</AppLink>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 5, color: "text.secondary", textAlign: "center" }}>
                    {ct("No lot records are published yet.")} <AppLink href="/contact">{act("contact")}</AppLink> {ct("for documentation.")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </Section>
    </>
  )
}
