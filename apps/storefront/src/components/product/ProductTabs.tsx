"use client"

import { DownloadIcon as DownloadOutlinedIcon, DocumentIcon, SlidersIcon, TruckIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Tab from "@mui/material/Tab"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Tabs from "@mui/material/Tabs"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { formatMoney, type ProductLot } from "@/lib/product"
import { AppLink } from "../common/links"
import { useStore } from "../store/StoreProvider"

type ProductTabsProps = {
  description?: string | null
  specs: { label: string; value: string }[]
  lots: ProductLot[]
  productTitle: string
}

const cellLabel = { color: "text.secondary", width: { xs: "42%", sm: "32%" }, fontWeight: 500 }

export function LotTable({ lots, productTitle }: { lots: ProductLot[]; productTitle: string }) {
  if (!lots.length) {
    return (
      <Typography sx={{ color: "text.secondary" }}>
        Lot records for this product are available on request.{" "}
        <AppLink href={`/contact?subject=${encodeURIComponent(`Documentation: ${productTitle}`)}`}>Contact us</AppLink>.
      </Typography>
    )
  }
  return (
    <Box sx={{ overflowX: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2.5, bgcolor: "#fff" }}>
      <Table size="small" aria-label={`Documented lots for ${productTitle}`}>
        <TableHead>
          <TableRow>
            <TableCell scope="col">Lot</TableCell>
            <TableCell scope="col">Batch date</TableCell>
            <TableCell scope="col">Purity</TableCell>
            <TableCell scope="col" align="right">Certificate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lots.map((lot) => (
            <TableRow key={lot.lot}>
              <TableCell sx={{ fontFamily: "var(--font-dm-mono), monospace", fontWeight: 500 }}>{lot.lot}</TableCell>
              <TableCell>{lot.date ?? "—"}</TableCell>
              <TableCell sx={{ fontVariantNumeric: "tabular-nums" }}>{lot.purity ?? "—"}</TableCell>
              <TableCell align="right">
                {lot.coaUrl ? (
                  <Link href={lot.coaUrl} target="_blank" rel="noopener" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <DownloadOutlinedIcon sx={{ fontSize: 16 }} /> COA
                  </Link>
                ) : (
                  <AppLink href={`/contact?subject=${encodeURIComponent(`COA request: ${lot.lot}`)}`}>Request COA</AppLink>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export default function ProductTabs({ description, specs, lots, productTitle }: ProductTabsProps) {
  const [tab, setTab] = useState(0)
  const { region } = useStore()
  const threshold = region.freeShippingThreshold

  return (
    <Box>
      <Tabs value={tab} onChange={(_, value: number) => setTab(value)} aria-label="Product information" variant="scrollable" allowScrollButtonsMobile>
        <Tab icon={<SlidersIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Specifications" id="tab-0" aria-controls="tabpanel-0" />
        <Tab icon={<DocumentIcon sx={{ fontSize: 19 }} />} iconPosition="start" label={`Documentation (${lots.length})`} id="tab-1" aria-controls="tabpanel-1" />
        <Tab icon={<TruckIcon sx={{ fontSize: 19 }} />} iconPosition="start" label="Shipping & handling" id="tab-2" aria-controls="tabpanel-2" />
      </Tabs>

      <Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0" hidden={tab !== 0} tabIndex={0} sx={{ py: 4 }}>
        {description ? <Typography sx={{ mb: 3, maxWidth: 720, whiteSpace: "pre-line" }}>{description}</Typography> : null}
        <Table size="small" aria-label="Specifications" sx={{ maxWidth: 760 }}>
          <TableBody>
            {specs.map((spec) => (
              <TableRow key={spec.label}>
                <TableCell component="th" scope="row" sx={cellLabel}>
                  {spec.label}
                </TableCell>
                <TableCell>{spec.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1" hidden={tab !== 1} tabIndex={0} sx={{ py: 4 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, maxWidth: 680 }}>
          Match any available batch documentation to the lot number on your product.
          Consult the lot-specific certificate for reported purity and identity results.
        </Typography>
        <LotTable lots={lots} productTitle={productTitle} />
      </Box>

      <Box role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2" hidden={tab !== 2} tabIndex={0} sx={{ py: 4 }}>
        <Box component="ul" sx={{ pl: 2.5, m: 0, "& li": { mb: 1.25 } }}>
          <li>
            <Typography>
              <strong>Standard</strong>: 3–5 business days, tracked.
              {threshold ? ` Free on orders over ${formatMoney(threshold, region.currencyCode, { whole: true })}.` : ""}
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Express</strong>: 1–2 business days, tracked.
            </Typography>
          </li>
          <li>
            <Typography>
              Products ship in protective packaging. Follow the product-specific storage and handling information supplied with your batch.
            </Typography>
          </li>
          <li>
            <Typography>
              Orders ship once payment is confirmed. See <AppLink href="/legal/shipping-returns">shipping & returns</AppLink>.
            </Typography>
          </li>
        </Box>
      </Box>
    </Box>
  )
}
