"use client"

import { useTranslations } from "next-intl"

import { CloseIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useMoney } from "@/lib/money"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CartAnnouncer from "./CartAnnouncer"
import CartLineItem from "./CartLineItem"
import FreeShippingProgress from "./FreeShippingProgress"
import AcceptedPaymentMethods from "../common/AcceptedPaymentMethods"

export default function CartDrawer() {
  const act = useTranslations("Actions")
  const money = useMoney()
  const { cart, drawerOpen, closeDrawer, itemCount, error, clearError, region } = useStore()
  const items = [...(cart?.items ?? [])].sort((a, b) =>
    String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""))
  )
  const currency = cart?.currency_code ?? region.currencyCode
  const itemTotal = Number(cart?.item_total ?? 0)
  const subtotal = Number(cart?.item_subtotal ?? itemTotal)
  const discount = Number(cart?.discount_total ?? 0)

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={closeDrawer}
      slotProps={{ paper: { role: "dialog", "aria-modal": true, "aria-labelledby": "cart-drawer-title", sx: { width: { xs: "100%", sm: 460 }, bgcolor: "#f7f9fa", overscrollBehavior: "contain" } } }}
    >
      <CartAnnouncer />
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="h5" component="h2" id="cart-drawer-title">
            Your cart{itemCount ? ` (${itemCount})` : ""}
          </Typography>
          <IconButton aria-label={act("closeCart")} onClick={closeDrawer}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Box sx={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", px: 3 }}>
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
                {act("shopCatalog")}
              </ButtonLink>
            </Stack>
          )}
        </Box>

        {items.length ? (
          <Box sx={{ flexShrink: 0, px: 3, pt: 2.5, pb: "max(20px, env(safe-area-inset-bottom))", borderTop: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontWeight: 600 }}>Subtotal</Typography>
              <Typography sx={{ fontWeight: 700 }}>{money(subtotal, currency)}</Typography>
            </Stack>
            {discount > 0 ? (
              <Stack direction="row" sx={{ justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ color: "text.secondary" }}>Discount</Typography>
                <Typography sx={{ fontWeight: 600 }}>−{money(discount, currency)}</Typography>
              </Stack>
            ) : null}
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              Shipping and taxes are calculated at checkout.
            </Typography>
            <Stack direction="row" spacing={1.5}>
              <ButtonLink href="/cart" variant="outlined" color="primary" onClick={closeDrawer} sx={{ flex: 1 }}>
                {act("viewCart")}
              </ButtonLink>
              <ButtonLink href="/checkout" variant="contained" onClick={closeDrawer} sx={{ flex: 1 }}>
                {act("checkout")}
              </ButtonLink>
            </Stack>
            <Box sx={{ mt: 1.75, minHeight: 24 }}><AcceptedPaymentMethods enabled={drawerOpen} regionId={cart?.region_id || region.id} currency={currency} caption={false} /></Box>
          </Box>
        ) : null}
      </Stack>
    </Drawer>
  )
}
