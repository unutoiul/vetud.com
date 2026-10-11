import Box from "@mui/material/Box"
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
import SectionHeading, { SerifAccent } from "@/components/common/SectionHeading"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { listProducts } from "@/lib/medusa/products"
import { readProductMeta } from "@/lib/product"

export const metadata: Metadata = {
  title: "Lot documentation",
  description: "Look up any Vetud lot number to see its batch date, purity result and certificate of analysis.",
}

export default async function DocumentationPage() {
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
        eyebrow="Documentation"
        title={
          <>
            Every lot, <SerifAccent>on the record.</SerifAccent>
          </>
        }
        description="Enter the lot number printed on your vial label to see its batch record. Certificates of analysis are available for every lot."
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
                <TableCell>Lot</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Batch date</TableCell>
                <TableCell>Purity</TableCell>
                <TableCell align="right">Certificate</TableCell>
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
                  <TableCell>{lot.purity ?? "—"}</TableCell>
                  <TableCell align="right">
                    {lot.coaUrl ? (
                      <a href={lot.coaUrl} target="_blank" rel="noopener">
                        Download
                      </a>
                    ) : (
                      <AppLink href={`/contact?subject=${encodeURIComponent(`COA request: ${lot.lot}`)}`}>Request</AppLink>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Section>
    </>
  )
}
