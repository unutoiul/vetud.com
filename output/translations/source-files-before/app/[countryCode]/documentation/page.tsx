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
import { getLotReportCounts } from "@/lib/medusa/forum"
import { listProducts } from "@/lib/medusa/products"
import { readProductMeta } from "@/lib/product"

export const metadata: Metadata = {
  title: "Lot documentation",
  description: "Look up any Vetud lot number to see its batch date, purity result and certificate of analysis.",
}

export default async function DocumentationPage() {
  const act = await getTranslations("Actions")
  const { region } = await getCurrentRegion()
  const products = await listProducts({ regionId: region.id })
  const rows = products
    .flatMap((product) => {
      const meta = readProductMeta(product)
      return meta.lots.map((lot) => ({ product, meta, lot }))
    })
    .sort((a, b) => (b.lot.date ?? "").localeCompare(a.lot.date ?? "") || a.lot.lot.localeCompare(b.lot.lot))
  // Community posts that name each lot. The register still renders if the community is unreachable.
  const reports: Record<string, number> = await getLotReportCounts(rows.map(({ lot }) => lot.lot)).catch(() => ({}))

  return (
    <>
      <PageHeader
        eyebrow="Documentation"
        title="Every lot, on the record."
        description="Enter the lot number printed on your packaging to find a published batch record. Request any additional analytical documentation from our team."
      />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={56} sx={{ maxWidth: 640 }} />}>
          <LotLookup />
        </Suspense>
      </Section>
      <Section tone="paper">
        <SectionHeading
          eyebrow={`Lot register · ${rows.length} lots`}
          title="Current and recent batches."
          description="Lots currently in circulation across the catalog, newest first."
        />
        <Box sx={{ overflowX: "auto", bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <Table aria-label="Lot register">
            <TableHead>
              <TableRow>
                <TableCell scope="col">{act("lot")}</TableCell>
                <TableCell scope="col">Product</TableCell>
                <TableCell scope="col">Batch date</TableCell>
                <TableCell scope="col">Purity</TableCell>
                <TableCell scope="col">Member reports</TableCell>
                <TableCell scope="col" align="right">Certificate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(({ product, meta, lot }) => (
                <TableRow key={`${product.id}-${lot.lot}`} hover>
                  <TableCell sx={{ fontFamily: "var(--font-dm-mono), monospace", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {lot.lot}
                  </TableCell>
                  <TableCell>
                    <AppLink href={`/products/${product.handle}`}>{product.title}</AppLink>
                    <Typography variant="mono" component="span" sx={{ color: "text.secondary", ml: 1, fontSize: 11 }}>
                      {meta.code}
                    </Typography>
                  </TableCell>
                  <TableCell>{lot.date ?? "—"}</TableCell>
                  <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>{lot.purity ?? "—"}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {reports[lot.lot] ? <AppLink href={`/community?lot=${encodeURIComponent(lot.lot)}`}>{act("reports", { count: reports[lot.lot] })}</AppLink> : "—"}
                  </TableCell>
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
                    No lot records are published yet. <AppLink href="/contact">{act("contact")}</AppLink> for documentation.
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
