import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import type { ProductLot } from "@/lib/product"

export default function LotTable({ lots, productTitle }: { lots: ProductLot[]; productTitle: string }) {
  if (!lots.length) return <Box sx={{ p: 3, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "5px" }}>
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Request the current batch record.</Typography>
    <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 13 }}>A certificate for this product is not currently published here. Contact the team with your lot number to request the available documentation.</Typography>
    <AppLink href={`/contact?subject=${encodeURIComponent(`Documentation: ${productTitle}`)}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, mt: 2, fontSize: 13 }}>Request documentation <Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></AppLink>
  </Box>
  return <Box sx={{ overflowX: "auto", border: "1px solid", borderColor: "divider", borderRadius: "5px" }}><Table size="small" aria-label={`Documented lots for ${productTitle}`}>
    <TableHead><TableRow><TableCell scope="col">Lot</TableCell><TableCell scope="col">Batch date</TableCell><TableCell scope="col">Purity</TableCell><TableCell scope="col" align="right">Certificate</TableCell></TableRow></TableHead>
    <TableBody>{lots.map(lot => <TableRow key={lot.lot}><TableCell sx={{ fontFamily: "var(--font-dm-mono), monospace", whiteSpace: "nowrap", fontSize: 12 }}>{lot.lot}</TableCell><TableCell>{lot.date ?? "—"}</TableCell><TableCell>{lot.purity ?? "—"}</TableCell><TableCell align="right">{lot.coaUrl ? <Link href={lot.coaUrl} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-flex", alignItems: "center", gap: .5 }}><Icon name="download" sx={{ fontSize: 16 }} />COA</Link> : <AppLink href={`/contact?subject=${encodeURIComponent(`COA request: ${lot.lot}`)}`}>Request COA</AppLink>}</TableCell></TableRow>)}</TableBody>
  </Table></Box>
}
