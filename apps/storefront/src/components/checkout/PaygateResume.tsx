import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { paygateOrderLink } from "@/lib/paygate"

export default function PaygateResume({ checkoutUrl }: { checkoutUrl?: string }) {
  const url = paygateOrderLink(checkoutUrl)
  if (!url) return null
  return <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
    <Button component="a" href={url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" variant="contained">Complete PayGate payment</Button>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>Checkout opens in a new tab. After paying, return to your orders and refresh the status. If you already paid, wait for confirmation before paying again.</Typography>
  </Stack>
}
