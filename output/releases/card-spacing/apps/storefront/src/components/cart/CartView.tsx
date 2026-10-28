"use client"

import { LockIcon as LockOutlinedIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CartLineItem from "./CartLineItem"
import FreeShippingProgress from "./FreeShippingProgress"
import OrderTotals from "./OrderTotals"

export default function CartView() {
  const { cart, cartReady, error, clearError, region } = useStore()

  if (!cartReady) {
    return (
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={260} />
        </Grid>
      </Grid>
    )
  }

  const items = [...(cart?.items ?? [])].sort((a, b) =>
    String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  )

  if (!cart || !items.length) {
    return (
      <Stack spacing={2} sx={{ py: 6, alignItems: "flex-start" }}>
        <Typography variant="h4" component="h2">
          Your cart is empty.
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>Add products from the catalog to get started.</Typography>
        <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
          Shop the catalog
        </ButtonLink>
      </Stack>
    )
  }

  const currency = cart.currency_code ?? region.currencyCode

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7.5 }}>
        {error ? (
          <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <FreeShippingProgress itemTotal={Number(cart.item_total ?? 0)} currencyCode={currency} />
        <Box sx={{ mt: 1 }}>
          {items.map((item) => (
            <CartLineItem key={item.id} item={item} currencyCode={currency} />
          ))}
        </Box>
        <ButtonLink href="/shop" variant="text" color="secondary" sx={{ mt: 2, px: 0 }}>
          ← Continue shopping
        </ButtonLink>
      </Grid>
      <Grid size={{ xs: 12, md: 4.5 }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: "#f7f9fa", borderRadius: 3, position: { md: "sticky" }, top: { md: 110 } }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Order summary
          </Typography>
          <OrderTotals totals={{ ...cart, currency_code: currency }} shippingKnown={false} />
          <ButtonLink href="/checkout" variant="contained" size="large" fullWidth startIcon={<LockOutlinedIcon />} sx={{ mt: 3 }}>
            Proceed to checkout
          </ButtonLink>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            Pay by bank transfer after ordering. Your items are reserved as soon as you place the order.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}
