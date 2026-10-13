"use client"

import type { HttpTypes } from "@medusajs/types"
import { BankIcon as AccountBalanceOutlinedIcon, LockIcon as LockOutlinedIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Step from "@mui/material/Step"
import StepButton from "@mui/material/StepButton"
import Stepper from "@mui/material/Stepper"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { formatMoney } from "@/lib/product"
import CartLineItem from "../cart/CartLineItem"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"
import { CART_FIELDS, useStore } from "../store/StoreProvider"
import AddressFields, { toAddressValues, validateAddress, type AddressValues } from "./AddressFields"

const STEPS = ["Details", "Delivery", "Payment", "Review"]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const PAYMENT_LABELS: Record<string, { title: string; description: string }> = {
  pp_system_default: {
    title: "Bank transfer / invoice",
    description:
      "Place your order now and pay by bank transfer. Payment instructions and your reference are emailed right after you order. Stock is reserved while we wait for your payment.",
  },
}

function hasPaymentSession(cart: HttpTypes.StoreCart) {
  return Boolean(cart.payment_collection?.payment_sessions?.length)
}

function initialStep(cart: HttpTypes.StoreCart) {
  if (!cart.email || !cart.shipping_address?.address_1) return 0
  if (!cart.shipping_methods?.length) return 1
  if (!hasPaymentSession(cart)) return 2
  return 3
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      disabled={busy}
      startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
      sx={{ mt: 3, minWidth: 220 }}
    >
      {children}
    </Button>
  )
}

export default function CheckoutFlow() {
  const router = useRouter()
  const { cart, cartReady, setCart, clearCart, region, countries, countryCode } = useStore()
  const [step, setStep] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)

  const regionCountries = countries.filter((country) => country.regionId === region.id)

  if (completedOrderId) {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress color="secondary" />
        <Typography>Order placed. Opening your confirmation…</Typography>
      </Stack>
    )
  }

  if (!cartReady) {
    return <Skeleton variant="rounded" height={420} />
  }

  if (!cart || !cart.items?.length) {
    return (
      <Stack spacing={2} sx={{ py: 6, alignItems: "flex-start" }}>
        <Typography variant="h4" component="h2">
          Your cart is empty.
        </Typography>
        <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
          Shop the catalog
        </ButtonLink>
      </Stack>
    )
  }

  // Until the visitor picks a step, resume where the saved cart left off.
  const maxReachable = initialStep(cart)
  const activeStep = step ?? maxReachable
  const currency = cart.currency_code

  const guard = async (task: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await task()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const placeOrder = () =>
    guard(async () => {
      const result = await sdk.store.cart.complete(cart.id)
      if (result.type !== "order") {
        throw new Error(result.error?.message ?? "We couldn't place your order. Please review your details.")
      }
      try {
        window.sessionStorage.setItem(`vetud_order_${result.order.id}`, JSON.stringify(result.order))
      } catch {
        // The confirmation page fetches the order when storage is unavailable.
      }
      setCompletedOrderId(result.order.id)
      clearCart()
      router.push(`/${countryCode}/order/confirmed?id=${encodeURIComponent(result.order.id)}`)
    })

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stepper nonLinear activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label, index) => (
            <Step key={label} completed={index < maxReachable && index !== activeStep}>
              <StepButton onClick={() => setStep(index)} disabled={index > maxReachable || busy}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>

        {error ? (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          {activeStep === 0 ? (
            <DetailsStep
              cart={cart}
              countries={regionCountries}
              defaultCountry={regionCountries.some((country) => country.code === countryCode) ? countryCode : regionCountries[0]?.code ?? ""}
              busy={busy}
              onSubmit={(body) =>
                guard(async () => {
                  const { cart: updated } = await sdk.store.cart.update(cart.id, body, { fields: CART_FIELDS })
                  setCart(updated)
                  setStep(1)
                })
              }
            />
          ) : null}
          {activeStep === 1 ? (
            <DeliveryStep
              cart={cart}
              busy={busy}
              onError={setError}
              onSubmit={(optionId) =>
                guard(async () => {
                  const { cart: updated } = await sdk.store.cart.addShippingMethod(
                    cart.id,
                    { option_id: optionId },
                    { fields: CART_FIELDS }
                  )
                  setCart(updated)
                  setStep(2)
                })
              }
            />
          ) : null}
          {activeStep === 2 ? (
            <PaymentStep
              cart={cart}
              busy={busy}
              onError={setError}
              onSubmit={(providerId) =>
                guard(async () => {
                  const existing = cart.payment_collection?.payment_sessions?.find(
                    (session) => session.provider_id === providerId
                  )
                  if (!existing) {
                    await sdk.store.payment.initiatePaymentSession(cart, { provider_id: providerId })
                  }
                  const { cart: updated } = await sdk.store.cart.retrieve(cart.id, { fields: CART_FIELDS })
                  setCart(updated)
                  setStep(3)
                })
              }
            />
          ) : null}
          {activeStep === 3 ? <ReviewStep cart={cart} busy={busy} onEdit={setStep} onPlaceOrder={placeOrder} /> : null}
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: "#f7f9fa", borderRadius: 3, position: { md: "sticky" }, top: { md: 110 } }}>
          <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
            Order summary
          </Typography>
          <Box sx={{ mb: 2 }}>
            {(cart.items ?? []).map((item) => (
              <CartLineItem key={item.id} item={item} currencyCode={currency} readOnly />
            ))}
          </Box>
          <OrderTotals totals={cart} shippingKnown={Boolean(cart.shipping_methods?.length)} />
          <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center", color: "text.secondary" }}>
            <LockOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">Your details are sent over an encrypted connection.</Typography>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )
}

type DetailsBody = {
  email: string
  shipping_address: AddressValues
  billing_address: AddressValues
}

function DetailsStep({
  cart,
  countries,
  defaultCountry,
  busy,
  onSubmit,
}: {
  cart: HttpTypes.StoreCart
  countries: { code: string; name: string }[]
  defaultCountry: string
  busy: boolean
  onSubmit: (body: DetailsBody) => void
}) {
  const [email, setEmail] = useState(cart.email ?? "")
  const [shipping, setShipping] = useState<AddressValues>(() => {
    const values = toAddressValues(cart.shipping_address)
    return { ...values, country_code: values.country_code || defaultCountry }
  })
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState<AddressValues>(() => {
    const values = toAddressValues(cart.billing_address)
    return { ...values, country_code: values.country_code || defaultCountry }
  })
  const [showErrors, setShowErrors] = useState(false)

  const emailError = !EMAIL_PATTERN.test(email.trim()) ? "Enter a valid email address" : undefined
  const shippingErrors = validateAddress(shipping)
  const billingErrors = billingSame ? {} : validateAddress(billing)
  const valid = !emailError && !Object.keys(shippingErrors).length && !Object.keys(billingErrors).length

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setShowErrors(true)
        if (!valid) {
          const field = emailError
            ? "email"
            : Object.keys(shippingErrors).length
              ? `shipping-${Object.keys(shippingErrors)[0]}`
              : `billing-${Object.keys(billingErrors)[0]}`
          const control = event.currentTarget.querySelector<HTMLElement>(`[id="${field}"]`)
            ?? event.currentTarget.querySelector<HTMLInputElement>(`[name="${field}"]`)
          control?.focus()
          return
        }
        onSubmit({ email: email.trim(), shipping_address: shipping, billing_address: billingSame ? shipping : billing })
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Contact
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Your order confirmation and payment instructions are sent here.
      </Typography>
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={showErrors && Boolean(emailError)}
        helperText={showErrors ? emailError : undefined}
        slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }}
      />

      <Typography variant="h5" component="h2" sx={{ mt: 4, mb: 2 }}>
        Shipping address
      </Typography>
      <AddressFields
        prefix="shipping"
        values={shipping}
        errors={showErrors ? shippingErrors : {}}
        countries={countries}
        onChange={setShipping}
      />
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
        Shipping somewhere else? Change the country in the header to see that region&apos;s prices.
      </Typography>

      <FormControlLabel
        sx={{ mt: 2 }}
        control={<Checkbox checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />}
        label="Billing address is the same as shipping"
      />
      {!billingSame ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            Billing address
          </Typography>
          <AddressFields
            prefix="billing"
            values={billing}
            errors={showErrors ? billingErrors : {}}
            countries={countries}
            onChange={setBilling}
          />
        </Box>
      ) : null}

      <SubmitButton busy={busy}>Continue to delivery</SubmitButton>
    </Box>
  )
}

function DeliveryStep({
  cart,
  busy,
  onError,
  onSubmit,
}: {
  cart: HttpTypes.StoreCart
  busy: boolean
  onError: (message: string) => void
  onSubmit: (optionId: string) => void
}) {
  const [options, setOptions] = useState<HttpTypes.StoreCartShippingOption[] | null>(null)
  const [selected, setSelected] = useState(cart.shipping_methods?.[0]?.shipping_option_id ?? "")

  useEffect(() => {
    let cancelled = false
    sdk.store.fulfillment
      .listCartOptions({ cart_id: cart.id })
      .then(({ shipping_options }) => {
        if (cancelled) return
        setOptions(shipping_options)
        setSelected((current) => current || shipping_options[0]?.id || "")
      })
      .catch((err) => {
        if (!cancelled) {
          setOptions([])
          onError(errorMessage(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [cart.id, cart.item_total, onError])

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault()
        if (selected) onSubmit(selected)
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Delivery method
      </Typography>
      {options === null ? (
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={72} />
          <Skeleton variant="rounded" height={72} />
        </Stack>
      ) : options.length ? (
        <RadioGroup name="delivery_method" value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Delivery method">
          <Stack spacing={1.5}>
            {options.map((option) => {
              const amount = Number(option.amount ?? 0)
              const type = (option as { type?: { description?: string } }).type
              return (
                <Box
                  key={option.id}
                  component="label"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    border: "1px solid",
                    borderColor: selected === option.id ? "secondary.main" : "brand.lineStrong",
                    bgcolor: selected === option.id ? "#eff5f6" : "#fff",
                    borderRadius: 2.5,
                    p: 2,
                    cursor: "pointer",
                    "&:focus-within": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
                  }}
                >
                  <Radio value={option.id} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                    {type?.description ? (
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {type.description}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography sx={{ fontWeight: 700 }}>{amount === 0 ? "Free" : formatMoney(amount, cart.currency_code)}</Typography>
                </Box>
              )
            })}
          </Stack>
        </RadioGroup>
      ) : (
        <Alert severity="warning">No delivery methods are available for this address. Please check the country, or contact us.</Alert>
      )}
      <SubmitButton busy={busy}>Continue to payment</SubmitButton>
    </Box>
  )
}

function PaymentStep({
  cart,
  busy,
  onError,
  onSubmit,
}: {
  cart: HttpTypes.StoreCart
  busy: boolean
  onError: (message: string) => void
  onSubmit: (providerId: string) => void
}) {
  const [providers, setProviders] = useState<HttpTypes.StorePaymentProvider[] | null>(null)
  const [selected, setSelected] = useState(cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? "")

  useEffect(() => {
    let cancelled = false
    sdk.store.payment
      .listPaymentProviders({ region_id: cart.region_id ?? "" })
      .then(({ payment_providers }) => {
        if (cancelled) return
        setProviders(payment_providers)
        setSelected((current) => current || payment_providers[0]?.id || "")
      })
      .catch((err) => {
        if (!cancelled) {
          setProviders([])
          onError(errorMessage(err))
        }
      })
    return () => {
      cancelled = true
    }
  }, [cart.region_id, onError])

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault()
        if (selected) onSubmit(selected)
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Payment
      </Typography>
      {providers === null ? (
        <Skeleton variant="rounded" height={110} />
      ) : (
        <RadioGroup name="payment_method" value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Payment method">
          <Stack spacing={1.5}>
            {providers.map((provider) => {
              const label = PAYMENT_LABELS[provider.id] ?? { title: provider.id, description: "" }
              return (
                <Box
                  key={provider.id}
                  component="label"
                  sx={{
                    display: "flex",
                    gap: 1,
                    border: "1px solid",
                    borderColor: selected === provider.id ? "secondary.main" : "brand.lineStrong",
                    bgcolor: selected === provider.id ? "#eff5f6" : "#fff",
                    borderRadius: 2.5,
                    p: 2,
                    cursor: "pointer",
                    "&:focus-within": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
                  }}
                >
                  <Radio value={provider.id} />
                  <Box sx={{ flex: 1, py: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <AccountBalanceOutlinedIcon fontSize="small" sx={{ color: "secondary.main" }} />
                      <Typography sx={{ fontWeight: 600 }}>{label.title}</Typography>
                    </Stack>
                    {label.description ? (
                      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        {label.description}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
              )
            })}
          </Stack>
        </RadioGroup>
      )}
      <SubmitButton busy={busy}>Review order</SubmitButton>
    </Box>
  )
}

function ReviewStep({
  cart,
  busy,
  onEdit,
  onPlaceOrder,
}: {
  cart: HttpTypes.StoreCart
  busy: boolean
  onEdit: (step: number) => void
  onPlaceOrder: () => void
}) {
  const address = cart.shipping_address
  const method = cart.shipping_methods?.[0]
  const provider = cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? ""

  const blocks = [
    {
      title: "Contact",
      step: 0,
      lines: [cart.email ?? ""],
    },
    {
      title: "Ship to",
      step: 0,
      lines: [
        [address?.first_name, address?.last_name].filter(Boolean).join(" "),
        address?.company,
        address?.address_1,
        address?.address_2,
        [address?.postal_code, address?.city, address?.province].filter(Boolean).join(" "),
        address?.country_code?.toUpperCase(),
      ].filter(Boolean) as string[],
    },
    {
      title: "Delivery",
      step: 1,
      lines: [
        `${method?.name ?? "—"} · ${Number(method?.amount ?? 0) === 0 ? "Free" : formatMoney(Number(method?.amount ?? 0), cart.currency_code)}`,
      ],
    },
    {
      title: "Payment",
      step: 2,
      lines: [PAYMENT_LABELS[provider]?.title ?? provider],
    },
  ]

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Review and place order
      </Typography>
      <Stack spacing={0}>
        {blocks.map((block) => (
          <Stack
            key={block.title}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ py: 1.75, borderBottom: "1px solid", borderColor: "divider", alignItems: "flex-start" }}
          >
            <Typography variant="eyebrow" sx={{ width: { xs: "auto", sm: 90 }, flexShrink: 0, color: "text.secondary", pt: "3px" }}>
              {block.title}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
              {block.lines.map((line) => (
                <Typography key={line}>{line}</Typography>
              ))}
            </Box>
            <Button size="small" variant="text" color="secondary" aria-label={`Edit ${block.title.toLowerCase()}`} onClick={() => onEdit(block.step)} disabled={busy} sx={{ alignSelf: "flex-start" }}>
              Edit
            </Button>
          </Stack>
        ))}
      </Stack>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
        By placing your order you agree to our terms of sale and confirm the products are for
        laboratory research use only. You will receive payment instructions by email; we ship as
        soon as payment is received.
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={onPlaceOrder}
        disabled={busy}
        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
        sx={{ mt: 3, minWidth: { xs: 0, sm: 260 }, width: { xs: "100%", sm: "auto" } }}
      >
        {busy ? "Placing order…" : `Place order · ${formatMoney(Number(cart.total ?? 0), cart.currency_code)}`}
      </Button>
    </Box>
  )
}
