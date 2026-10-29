"use client"

import type { HttpTypes } from "@medusajs/types"
import { useLocale, useTranslations } from "next-intl"
import { getCountryRules } from "@/i18n/config"
import { normalizeAddress, formatAddressLines } from "@/lib/address"
import Icon, { type IconName, LockIcon as LockOutlinedIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormHelperText from "@mui/material/FormHelperText"
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
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { MAKEPAY_PROVIDER_ID, MAKEPAY_STORAGE, readMakePayRedirect } from "@/lib/makepay"
import { persistCountryCookie } from "@/lib/country-cookie"
import { sdk } from "@/lib/medusa/sdk"
import { PAYPAL_PROVIDER_ID, readPayPalRedirect } from "@/lib/paypal"
import { formatMoney } from "@/lib/product"
import { serializeOrderReceipt } from "@/lib/order-receipt"
import { NMI_PROVIDER_ID, nmiAvailable, nmiCartFingerprint, readNmiSession, type NmiConfig, type NmiToken } from "@/lib/nmi"
import { PAYGATE_CARD, PAYGATE_CRYPTO, isPaygate, readPaygateRedirect, type PaygateConfig } from "@/lib/paygate"
import { hasResearchAcknowledgment, researchAcknowledgmentMetadata, RUO_ACK_TEXT } from "@/lib/research"
import { AuthPanel } from "../account/AccountPage"
import { useAccount } from "../account/AccountProvider"
import CartLineItem from "../cart/CartLineItem"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"
import { CART_FIELDS, useStore } from "../store/StoreProvider"
import AddressFields, { EMPTY_ADDRESS, toAddressValues, validateAddress, type AddressValues } from "./AddressFields"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NmiPaymentForm = dynamic(() => import("./NmiPaymentForm"), { ssr: false, loading: () => <Skeleton variant="rounded" height={240} /> })

const PAYMENT_LABELS: Record<string, { title: string; description: string; icon?: IconName }> = {
  [PAYGATE_CARD]: {
    icon: "card", title: "Card payment via PayGate.to",
    description: "Reserve your order, then continue to hosted card checkout. Available providers, fees and any identity checks are shown before you pay. We ship after payment is confirmed.",
  },
  [PAYGATE_CRYPTO]: {
    icon: "coin", title: "Cryptocurrency via PayGate.to",
    description: "Reserve your order, then choose a coin and network on hosted checkout. Send the exact quoted amount above the displayed network minimum. Network fees are shown there.",
  },
  [NMI_PROVIDER_ID]: {
    icon: "card",
    title: "Credit / debit card or eligible bank account",
    description: "Enter payment details securely on the next step. Cards are authorized now and captured when ready to ship. Bank debit is available only when enabled and must settle before shipment.",
  },
  pp_system_default: {
    icon: "bank",
    title: "Bank transfer / invoice",
    description:
      "Place your order now and pay by bank transfer. Payment instructions and your reference are emailed right after you order. Stock is reserved while we wait for your payment.",
  },
  [MAKEPAY_PROVIDER_ID]: {
    icon: "coin",
    title: "Pay with cryptocurrency",
    description:
      "Place your order, then pay on MakePay's secure hosted page. Your order is confirmed as soon as the network confirms your payment.",
  },
  [PAYPAL_PROVIDER_ID]: {
    icon: "wallet",
    title: "PayPal",
    description:
      "You'll be taken to PayPal to pay. Your order is placed as soon as the payment is confirmed.",
  },
}

function hasPaymentSession(cart: HttpTypes.StoreCart) {
  return Boolean(cart.payment_collection?.payment_sessions?.length)
}

function initialStep(cart: HttpTypes.StoreCart) {
  if (!cart.email || !cart.shipping_address?.address_1 || !hasResearchAcknowledgment(cart)) return 0
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
  const checkoutText = useTranslations("Checkout")
  const steps = [checkoutText("details"), checkoutText("delivery"), checkoutText("payment"), checkoutText("review")]
  const router = useRouter()
  const { cart, cartReady, setCart, clearCart, linkCustomerCart, isCurrentCart, region, countries, countryCode } = useStore()
  const { customer, loading: accountLoading, createAddress, captureSession } = useAccount()
  const [step, setStep] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)
  const locale = useLocale()
  const stepperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // When the shopper moves between steps, bring the progress bar into view and focus the
  // new step's heading, so nobody is left at the bottom of the previous, longer step.
  useEffect(() => {
    if (step === null) return
    const heading = panelRef.current?.querySelector<HTMLElement>("h2")
    heading?.setAttribute("tabindex", "-1")
    heading?.focus({ preventScroll: true })
    stepperRef.current?.scrollIntoView({ block: "start" })
  }, [step])

  if (completedOrderId) {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress color="secondary" />
        <Typography>Order placed. Opening your confirmation…</Typography>
      </Stack>
    )
  }

  if (!cartReady || accountLoading) {
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

  // An account is required to order: there is no guest checkout.
  if (!customer) {
    return <AuthPanel context="checkout" />
  }

  // Until the visitor picks a step, resume where the saved cart left off.
  const maxReachable = initialStep(cart)
  const activeStep = step ?? maxReachable
  const currency = cart.currency_code

  const guard = async (task: (assertCurrent: () => void) => Promise<void>) => {
    if (busyRef.current) return
    busyRef.current = true
    const assertSession = captureSession()
    const assertCurrent = () => {
      assertSession()
      if (!isCurrentCart(cart.id)) throw new Error("Your cart changed. Please return to checkout.")
    }
    setBusy(true)
    setError(null)
    try {
      assertCurrent()
      await task(assertCurrent)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const placeOrder = (nmiToken?: NmiToken) =>
    guard(async (assertCurrent) => {
      let checkoutCart = customer ? await linkCustomerCart() : cart
      assertCurrent()
      if (!hasResearchAcknowledgment(checkoutCart)) {
        setStep(0)
        throw new Error("Please confirm the research-use acknowledgment before placing your order.")
      }
      if (Number(checkoutCart.total) !== Number(cart.total)) {
        setStep(2)
        throw new Error("Your account pricing has been applied. Please review the updated total and choose payment again.")
      }
      const isNmi = checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === NMI_PROVIDER_ID)
      if (isNmi || nmiToken) {
        if (!isNmi || !nmiToken || nmiCartFingerprint(checkoutCart) !== nmiCartFingerprint(cart)) {
          setCart(checkoutCart)
          setStep(2)
          throw new Error("Your checkout changed. Review your order and re-enter your secure payment details.")
        }
        // Send only the one-use token and consent; never echo signed session
        // state, billing, amounts, card numbers or bank numbers to this route.
        await sdk.store.payment.initiatePaymentSession(checkoutCart, { provider_id: NMI_PROVIDER_ID, data: nmiToken })
        assertCurrent()
        const { cart: refreshed } = await sdk.store.cart.retrieve(checkoutCart.id, { fields: CART_FIELDS })
        assertCurrent()
        if (nmiCartFingerprint(refreshed) !== nmiCartFingerprint(checkoutCart)) {
          setCart(refreshed)
          setStep(2)
          throw new Error("Your total or delivery details changed. Review the order before paying.")
        }
        checkoutCart = refreshed
      }
      // PayPal: the shopper approves the payment first; the order is created when they come back
      // (see the PayPal return page), so the cart is deliberately not completed here.
      if (checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === PAYPAL_PROVIDER_ID)) {
        window.location.assign(readPayPalRedirect(checkoutCart).url)
        return
      }
      // Crypto: validate the hosted-checkout redirect first, create the order, then leave for MakePay.
      const isMakePay = checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === MAKEPAY_PROVIDER_ID)
      const paygateRedirect = checkoutCart.payment_collection?.payment_sessions?.some(session => isPaygate(session.provider_id)) ? readPaygateRedirect(checkoutCart) : null
      const redirect = isMakePay ? readMakePayRedirect(checkoutCart) : null
      const result = await sdk.store.cart.complete(checkoutCart.id)
      assertCurrent()
      if (result.type !== "order") {
        throw new Error(result.error?.message ?? "We couldn't place your order. Please review your details.")
      }
      try {
        const receipt = serializeOrderReceipt(result.order, customer?.id)
        if (receipt) window.sessionStorage.setItem(`vetud_order_${result.order.id}`, receipt)
      } catch {
        // The confirmation page fetches the order when storage is unavailable.
      }
      if (paygateRedirect) {
        setCompletedOrderId(result.order.id)
        clearCart()
        window.location.assign(paygateRedirect.url)
        return
      }
      if (redirect) {
        try {
          window.sessionStorage.setItem(MAKEPAY_STORAGE.orderId, result.order.id)
          window.sessionStorage.setItem(MAKEPAY_STORAGE.returnState, redirect.returnState)
          window.sessionStorage.setItem(MAKEPAY_STORAGE.countryCode, countryCode)
        } catch {
          // The return page still verifies payment from the state in its URL.
        }
        setCompletedOrderId(result.order.id)
        clearCart()
        window.location.assign(redirect.url)
        return
      }
      setCompletedOrderId(result.order.id)
      clearCart()
      router.push(`/${countryCode}/order/confirmed?id=${encodeURIComponent(result.order.id)}`)
    })

  const summary = (
    <>
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
    </>
  )

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        {/* On small screens the summary sidebar would sit below the form, so the total stays visible up top. */}
        <Accordion sx={{ display: { md: "none" }, mb: 3, px: 2, bgcolor: "#f7f9fa", border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <AccordionSummary expandIcon={<Icon name="chevronDown" />} aria-controls="checkout-summary-content" id="checkout-summary-header" sx={{ minHeight: 64, "& .MuiAccordionSummary-content": { my: 2 } }}>
            <Typography sx={{ fontWeight: 600, flex: 1 }}>Order summary</Typography>
            <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatMoney(Number(cart.total ?? 0), currency, { locale })}</Typography>
          </AccordionSummary>
          <AccordionDetails>{summary}</AccordionDetails>
        </Accordion>

        <Stepper ref={stepperRef} nonLinear activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label, index) => (
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

        <Paper ref={panelRef} variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3, "& h2[tabindex='-1']:focus": { outline: "none" } }}>
          {activeStep === 0 ? (
            <DetailsStep
              key={`${cart.id}:${customer?.id ?? "guest"}`}
              cart={cart}
              countries={countries}
              regionId={region.id}
              customer={customer}
              defaultCountry={countries.some((country) => country.code === countryCode) ? countryCode : countries[0]?.code ?? ""}
              busy={busy}
              onSubmit={(body) =>
                guard(async (assertCurrent) => {
                  if (customer) await linkCustomerCart()
                  assertCurrent()
                  const { saveAddress, ...addressBody } = body
                  // Shipping to a country in another region changes the currency and prices.
                  const destination = countries.find((country) => country.code === body.shipping_address.country_code)
                  const switchRegion = destination && destination.regionId !== region.id ? destination : null
                  const cartBody = {
                    ...addressBody,
                    ...(switchRegion ? { region_id: switchRegion.regionId } : {}),
                    metadata: researchAcknowledgmentMetadata(),
                  }
                  const { cart: updated } = await sdk.store.cart.update(cart.id, cartBody, { fields: CART_FIELDS })
                  assertCurrent()
                  setCart(updated)
                  if (saveAddress && customer) {
                    await createAddress({
                      ...body.shipping_address,
                      address_name: "Primary shipping",
                      is_default_shipping: true,
                    })
                    assertCurrent()
                  }
                  if (switchRegion) {
                    // Open the checkout in the new country so the page shows its currency.
                    persistCountryCookie(switchRegion.code)
                    router.push(`/${switchRegion.code}/checkout`)
                    return
                  }
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
                guard(async (assertCurrent) => {
                  const { cart: updated } = await sdk.store.cart.addShippingMethod(
                    cart.id,
                    { option_id: optionId },
                    { fields: CART_FIELDS }
                  )
                  assertCurrent()
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
                guard(async (assertCurrent) => {
                  const checkoutCart = customer ? await linkCustomerCart() : cart
                  assertCurrent()
                  const existing = checkoutCart.payment_collection?.payment_sessions?.find(
                    (session) => session.provider_id === providerId
                  )
                  if (providerId === MAKEPAY_PROVIDER_ID || providerId === PAYPAL_PROVIDER_ID || providerId === NMI_PROVIDER_ID || isPaygate(providerId)) {
                    // A MakePay link or PayPal order is bound to one amount, so always create a fresh session.
                    await sdk.store.payment.initiatePaymentSession(checkoutCart, {
                      provider_id: providerId,
                      data: providerId === MAKEPAY_PROVIDER_ID && checkoutCart.email ? { customer_email: checkoutCart.email } : undefined,
                    })
                  } else if (!existing) {
                    await sdk.store.payment.initiatePaymentSession(checkoutCart, { provider_id: providerId })
                  }
                  assertCurrent()
                  const { cart: updated } = await sdk.store.cart.retrieve(cart.id, { fields: CART_FIELDS })
                  assertCurrent()
                  setCart(updated)
                  setStep(3)
                })
              }
            />
          ) : null}
          {activeStep === 3 ? <ReviewStep cart={cart} busy={busy} onEdit={setStep} onPlaceOrder={() => void placeOrder()} onNmiToken={placeOrder} /> : null}
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: "none", md: "block" } }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: "#f7f9fa", borderRadius: 3, position: { md: "sticky" }, top: { md: 110 } }}>
          <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
            Order summary
          </Typography>
          {summary}
        </Paper>
      </Grid>
    </Grid>
  )
}

type DetailsBody = {
  email: string
  shipping_address: AddressValues
  billing_address: AddressValues
  saveAddress: boolean
}

function DetailsStep({
  cart,
  countries,
  regionId,
  customer,
  defaultCountry,
  busy,
  onSubmit,
}: {
  cart: HttpTypes.StoreCart
  countries: { code: string; name: string; regionId: string; currencyCode: string }[]
  regionId: string
  customer: HttpTypes.StoreCustomer | null
  defaultCountry: string
  busy: boolean
  onSubmit: (body: DetailsBody) => void
}) {
  const t = useTranslations("Checkout")
  const ta = useTranslations("Address")
  const savedAddresses = useMemo(() => {
    const allowed = new Set(countries.map((country) => country.code))
    return (customer?.addresses ?? []).filter((address) => address.country_code && allowed.has(address.country_code))
  }, [countries, customer?.addresses])
  const preferredAddress = savedAddresses.find((address) => address.id === customer?.default_shipping_address_id)
    ?? savedAddresses.find((address) => address.is_default_shipping)
    ?? savedAddresses[0]
  const profileDefaults = { first_name: customer?.first_name, last_name: customer?.last_name, phone: customer?.phone }
  const [email, setEmail] = useState(cart.email ?? customer?.email ?? "")
  const [shipping, setShipping] = useState<AddressValues>(() => {
    const values = toAddressValues(cart.shipping_address ?? preferredAddress)
    return {
      ...values,
      first_name: values.first_name || customer?.first_name || "",
      last_name: values.last_name || customer?.last_name || "",
      phone: values.phone || customer?.phone || "",
      country_code: values.country_code || defaultCountry,
    }
  })
  const [selectedAddressId, setSelectedAddressId] = useState<string>(cart.shipping_address?.address_1 ? "custom" : preferredAddress?.id ?? "new")
  const [saveAddress, setSaveAddress] = useState(Boolean(customer && !preferredAddress))
  const [billingSame, setBillingSame] = useState(true)
  const [billing, setBilling] = useState<AddressValues>(() => {
    const values = toAddressValues(cart.billing_address ?? cart.shipping_address ?? preferredAddress)
    return { ...values, first_name: values.first_name || customer?.first_name || "", last_name: values.last_name || customer?.last_name || "", phone: values.phone || customer?.phone || "", country_code: values.country_code || defaultCountry }
  })
  const [acknowledged, setAcknowledged] = useState(hasResearchAcknowledgment(cart))
  const [showErrors, setShowErrors] = useState(false)
  const destination = countries.find((country) => country.code === shipping.country_code)

  const ackError = !acknowledged ? "You must confirm this to place an order" : undefined
  const emailError = !EMAIL_PATTERN.test(email.trim()) ? "Enter a valid email address" : undefined
  const shippingErrors = validateAddress(shipping, (key, args) => ta(key, args), ta(getCountryRules(shipping.country_code).postalLabel as "postal" | "zip" | "postcode"))
  const billingErrors = billingSame ? {} : validateAddress(billing, (key, args) => ta(key, args), ta(getCountryRules(billing.country_code).postalLabel as "postal" | "zip" | "postcode"))
  const valid = !emailError && !Object.keys(shippingErrors).length && !Object.keys(billingErrors).length && !ackError

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
              : Object.keys(billingErrors).length
                ? `billing-${Object.keys(billingErrors)[0]}`
                : "ruo_acknowledged"
          const control = event.currentTarget.querySelector<HTMLElement>(`[id="${field}"]`)
            ?? event.currentTarget.querySelector<HTMLInputElement>(`[name="${field}"]`)
          control?.focus()
          return
        }
        const shippingAddress = normalizeAddress(shipping)
        onSubmit({
          email: email.trim(),
          shipping_address: shippingAddress,
          billing_address: billingSame ? shippingAddress : normalizeAddress(billing),
          saveAddress: Boolean(customer && saveAddress && selectedAddressId === "new"),
        })
      }}
    >
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        {t("contact")}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        {t("contactHelp")}
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
        {t("shipping")}
      </Typography>
      {customer && savedAddresses.length ? (
        <Stack spacing={1.25} sx={{ mb: 2.5 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>{t("savedAddress")}</Typography>
          {savedAddresses.map((address) => (
            <Box
              key={address.id}
              component="button"
              type="button"
              onClick={() => { setSelectedAddressId(address.id); setShipping({ ...toAddressValues(address), phone: address.phone || customer.phone || "" }); setSaveAddress(false) }}
              sx={{ display: "block", width: "100%", textAlign: "left", border: "1px solid", borderColor: selectedAddressId === address.id ? "secondary.main" : "divider", bgcolor: selectedAddressId === address.id ? "#eff5f6" : "#fff", borderRadius: 2, p: 1.75, cursor: "pointer", font: "inherit", color: "inherit" }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{address.address_name || "Saved address"}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{[address.address_1, address.city, address.postal_code].filter(Boolean).join(" · ")}</Typography>
            </Box>
          ))}
          <Button type="button" size="small" onClick={() => { setSelectedAddressId("new"); setShipping({ ...EMPTY_ADDRESS, first_name: customer.first_name ?? "", last_name: customer.last_name ?? "", phone: customer.phone ?? "", country_code: defaultCountry }); setSaveAddress(true) }} sx={{ alignSelf: "flex-start" }}>
            {t("newAddress")}
          </Button>
        </Stack>
      ) : null}
      <AddressFields
        prefix="shipping"
        values={shipping}
        errors={showErrors ? shippingErrors : {}}
        countries={countries}
        onChange={setShipping}
        defaults={profileDefaults}
      />
      {destination && destination.regionId !== regionId ? (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
          {t("currencyChange", { currency: destination.currencyCode.toUpperCase(), country: destination.name })}
        </Typography>
      ) : null}
      {customer && selectedAddressId === "new" ? (
        <FormControlLabel
          sx={{ mt: 1 }}
          control={<Checkbox checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} />}
          label={t("save")}
        />
      ) : null}

      <FormControlLabel
        sx={{ mt: 2 }}
        control={<Checkbox checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />}
        label={t("billingSame")}
      />
      {!billingSame ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
            {t("billing")}
          </Typography>
          <AddressFields
            prefix="billing"
            values={billing}
            errors={showErrors ? billingErrors : {}}
            countries={countries}
            onChange={setBilling}
            defaults={profileDefaults}
          />
        </Box>
      ) : null}

      <FormControlLabel
        sx={{ mt: 3, alignItems: "flex-start" }}
        control={
          <Checkbox
            name="ruo_acknowledged"
            id="ruo_acknowledged"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            sx={{ pt: 0.5 }}
          />
        }
        label={<Typography variant="body2">{RUO_ACK_TEXT}</Typography>}
      />
      {showErrors && ackError ? <FormHelperText error>{ackError}</FormHelperText> : null}

      <SubmitButton busy={busy}>{t("continue")}</SubmitButton>
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
  const locale = useLocale()
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
                  <Typography sx={{ fontWeight: 700 }}>{amount === 0 ? "Free" : formatMoney(amount, cart.currency_code, { locale })}</Typography>
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
    Promise.all([
      sdk.store.payment.listPaymentProviders({ region_id: cart.region_id ?? "" }),
      sdk.client.fetch<NmiConfig>("/store/nmi/config", { method: "GET", cache: "no-store" }).catch(() => null),
      sdk.client.fetch<PaygateConfig>("/store/paygate/config", { method: "GET", cache: "no-store" }).catch(() => null),
    ])
      .then(([{ payment_providers }, config, paygate]) => {
        if (cancelled) return
        const available = payment_providers.filter(provider => {
          if (provider.id === PAYGATE_CARD) return paygate?.card === true
          if (provider.id === PAYGATE_CRYPTO) return paygate?.crypto === true
          return provider.id !== NMI_PROVIDER_ID || nmiAvailable(config, cart.currency_code)
        })
        setProviders(available)
        setSelected((current) => available.some((provider) => provider.id === current) ? current : available[0]?.id ?? "")
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
  }, [cart.region_id, cart.currency_code, onError])

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
                      <Icon name={label.icon ?? "lock"} fontSize="small" sx={{ color: "secondary.main" }} />
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
  onNmiToken,
}: {
  cart: HttpTypes.StoreCart
  busy: boolean
  onEdit: (step: number) => void
  onPlaceOrder: () => void
  onNmiToken: (token: NmiToken) => Promise<void>
}) {
  const locale = useLocale()
  const address = cart.shipping_address
  const method = cart.shipping_methods?.[0]
  const provider = cart.payment_collection?.payment_sessions?.[0]?.provider_id ?? ""
  const nmiSession = provider === NMI_PROVIDER_ID ? readNmiSession(cart) : null

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
        ...formatAddressLines(address ?? {}),
        address?.phone,
      ].filter(Boolean) as string[],
    },
    {
      title: "Research",
      step: 0,
      lines: [
        "Research use confirmed",
      ].filter(Boolean) as string[],
    },
    {
      title: "Delivery",
      step: 1,
      lines: [
        `${method?.name ?? "—"} · ${Number(method?.amount ?? 0) === 0 ? "Free" : formatMoney(Number(method?.amount ?? 0), cart.currency_code, { locale })}`,
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
        {provider === NMI_PROVIDER_ID
          ? "By authorizing payment and placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. Cards are captured when ready to dispatch. Bank debits must settle before dispatch."
          : isPaygate(provider)
          ? "By continuing you agree to our terms of sale and confirm the products are for laboratory research use only. Your order is reserved while you pay on PayGate's hosted checkout. Provider fees, network minimums and any identity checks are shown there. We ship after payment is verified."
          : provider === PAYPAL_PROVIDER_ID
          ? "By continuing you agree to our terms of sale and confirm the products are for laboratory research use only. You will be taken to PayPal to pay; your order is placed once the payment is confirmed, and we ship right after."
          : provider === MAKEPAY_PROVIDER_ID
          ? "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will be taken to MakePay to complete your payment; we ship as soon as it is confirmed."
          : "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will receive payment instructions by email; we ship as soon as payment is received."}
      </Typography>
      {provider === NMI_PROVIDER_ID ? (
        nmiSession ? <NmiPaymentForm key={`${nmiSession.id}:${nmiCartFingerprint(cart)}`} session={nmiSession} busy={busy} onToken={onNmiToken} />
          : <Alert severity="warning" sx={{ mt: 3 }} action={<Button onClick={() => onEdit(2)}>Choose payment</Button>}>Your secure payment session needs refreshing. Return to Payment to review the current currency and total.</Alert>
      ) : <Button
        variant="contained"
        size="large"
        onClick={onPlaceOrder}
        disabled={busy}
        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
        sx={{ mt: 3, minWidth: { xs: 0, sm: 260 }, width: { xs: "100%", sm: "auto" } }}
      >
        {busy
          ? provider === PAYPAL_PROVIDER_ID
            ? "Opening PayPal…"
            : "Placing order…"
          : `${isPaygate(provider) ? "Continue to PayGate" : provider === PAYPAL_PROVIDER_ID ? "Pay with PayPal" : "Place order"} · ${formatMoney(Number(cart.total ?? 0), cart.currency_code, { locale })}`}
      </Button>}
    </Box>
  )
}
