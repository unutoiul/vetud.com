"use client"

import CloseIcon from "@mui/icons-material/Close"
import NorthEastIcon from "@mui/icons-material/NorthEast"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { formatMoney } from "@/lib/product"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CartLineItem from "./CartLineItem"
import FreeShippingProgress from "./FreeShippingProgress"

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, itemCount, error, clearError, region } = useStore()
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  )
  const currency = cart?.currency_code ?? region.currencyCode
  const itemTotal = Number(cart?.item_total ?? 0)

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 440 } } } }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="h5" component="h2">
            Your cart{itemCount ? ` (${itemCount})` : ""}
          </Typography>
          <IconButton aria-label="Close cart" onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflowY: "auto", px: 3 }}>
          {error ? (
            <Alert severity="error" onClose={clearError} sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : null}
          {items.length ? (
            <>
              <Box sx={{ pt: 2 }}>
                <FreeShippingProgress itemTotal={itemTotal} currencyCode={currency} />
              </Box>
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} currencyCode={currency} onNavigate={closeDrawer} />
              ))}
            </>
          ) : (
            <Stack spacing={2} sx={{ py: 8, alignItems: "center", textAlign: "center" }}>
              <Typography variant="h5" component="p">
                Your cart is empty
              </Typography>
              <Typography sx={{ color: "text.secondary", maxWidth: 280 }}>
                Browse the collection to find documented research materials.
              </Typography>
              <ButtonLink href="/shop" variant="contained" onClick={closeDrawer} endIcon={<NorthEastIcon />}>
                Shop the catalog
              </ButtonLink>
            </Stack>
          )}
        </Box>

        {items.length ? (
          <Box sx={{ px: 3, py: 2.5, borderTop: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontWeight: 600 }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 700 }}>{formatMoney(itemTotal, currency)}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Shipping and taxes are calculated at checkout.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <ButtonLink href="/cart" variant="outlined" color="primary" onClick={closeDrawer} sx={{ flex: 1 }}>
                View cart
              </ButtonLink>
              <ButtonLink href="/checkout" variant="contained" onClick={closeDrawer} sx={{ flex: 1 }}>
                Checkout
              </ButtonLink>
            </Stack>
          </Box>
        ) : null}
      </Stack>
    </Drawer>
  )
}
