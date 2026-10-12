"use client"

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined"
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
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" aria-label={`Documented lots for ${productTitle}`}>
        <TableHead>
          <TableRow>
            <TableCell>Lot</TableCell>
            <TableCell>Batch date</TableCell>
            <TableCell>Purity</TableCell>
            <TableCell align="right">Certificate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {lots.map((lot) => (
            <TableRow key={lot.lot}>
              <TableCell sx={{ fontFamily: "var(--font-dm-mono), monospace", fontWeight: 500 }}>{lot.lot}</TableCell>
              <TableCell>{lot.date ?? "—"}</TableCell>
              <TableCell>{lot.purity ?? "—"}</TableCell>
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
        <Tab label="Specifications" id="tab-0" aria-controls="tabpanel-0" />
        <Tab label={`Documentation (${lots.length})`} id="tab-1" aria-controls="tabpanel-1" />
        <Tab label="Shipping & handling" id="tab-2" aria-controls="tabpanel-2" />
      </Tabs>

      <Box role="tabpanel" id="tabpanel-0" aria-labelledby="tab-0" hidden={tab !== 0} sx={{ py: 3 }}>
        {description ? <Typography sx={{ mb: 3, maxWidth: 720 }}>{description}</Typography> : null}
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

      <Box role="tabpanel" id="tabpanel-1" aria-labelledby="tab-1" hidden={tab !== 1} sx={{ py: 3 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, maxWidth: 680 }}>
          Every vial is labelled with its lot number. Each lot below has a batch record with HPLC
          purity and mass-spectrometry identity confirmation.
        </Typography>
        <LotTable lots={lots} productTitle={productTitle} />
      </Box>

      <Box role="tabpanel" id="tabpanel-2" aria-labelledby="tab-2" hidden={tab !== 2} sx={{ py: 3 }}>
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
              Lyophilized materials ship at ambient temperature with desiccant, sealed in a protective kit box. Store as specified on arrival.
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
