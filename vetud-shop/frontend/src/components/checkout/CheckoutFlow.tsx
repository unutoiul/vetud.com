"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import type { HttpTypes } from "@medusajs/types"
import { useLocale, useTranslations } from "next-intl"
import { translateAction } from "@/i18n/actions"
import { getCountryRules } from "@/i18n/config"
import { normalizeAddress, formatAddressLines, addressRepairFields, sameAddress } from "@/lib/address"
import Icon, { type IconName, LockIcon as LockOutlinedIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { MAKEPAY_PROVIDER_ID, MAKEPAY_STORAGE, readMakePayRedirect } from "@/lib/makepay"
import { PAYGATE_CARD, PAYGATE_CRYPTO, isPaygate, paygateAvailable, readPaygateRedirect, type PaygateConfig } from "@/lib/paygate"
import { SITE } from "@/lib/config"
import { sdk } from "@/lib/medusa/sdk"
import { PAYPAL_PROVIDER_ID, payPalAvailable, payPalCartFingerprint, type PayPalConfig } from "@/lib/paypal"
import { useMoney } from "@/lib/money"
import { hasShippingPrice } from "@/lib/shipping"
import { serializeOrderReceipt } from "@/lib/order-receipt"
import { NMI_PROVIDER_ID, nmiAvailable, nmiCartFingerprint, readNmiSession, type NmiConfig, type NmiToken } from "@/lib/nmi"
import { isCheckoutPaymentProvider } from "@/lib/payment-providers"
import { AuthPanel } from "../account/AccountPage"
import { useAccount } from "../account/AccountProvider"
import { ButtonLink } from "../common/links"
import { CART_FIELDS, useStore } from "../store/StoreProvider"
import AddressFields, { toAddressValues, validateAddress, type AddressValues } from "./AddressFields"
import PayPalReturn from "./PayPalReturn"
import CheckoutOrderSummary from "./CheckoutOrderSummary"

const NmiPaymentForm = dynamic(() => import("./NmiPaymentForm"), { ssr: false, loading: () => <Skeleton variant="rounded" height={240} /> })
const PayPalPaymentForm = dynamic(() => import("./PayPalPaymentForm"), { ssr: false, loading: () => <Skeleton variant="rounded" height={48} /> })

/** Display labels are translated without changing payment provider identifiers. */
const PAYMENT_LABELS: Record<string, { title: string; titleKey?: "payBank" | "payCrypto"; description: string; icon?: IconName }> = {
  [PAYGATE_CARD]: {
    icon: "card",
    title: "Credit / debit card · PayGate",
    description: "Place your order, then complete payment on PayGate's secure checkout. Any provider fees are shown before you pay.",
  },
  [PAYGATE_CRYPTO]: {
    icon: "coin",
    title: "Cryptocurrency · PayGate",
    description: "Place your order, then choose a supported cryptocurrency on PayGate. Network fees are shown before you pay.",
  },
  [NMI_PROVIDER_ID]: {
    icon: "card",
    title: "Credit / debit card or eligible bank account",
    description: "Enter payment details securely below. Cards are authorized now and captured when ready to ship. Bank debit is available only when enabled and must settle before shipment.",
  },
  pp_system_default: {
    icon: "bank",
    title: "Bank transfer / invoice",
    titleKey: "payBank",
    description:
      "Place your order now and pay by bank transfer. Payment instructions and your reference are emailed right after you order. Stock is reserved while we wait for your payment.",
  },
  [MAKEPAY_PROVIDER_ID]: {
    icon: "coin",
    title: "Pay with cryptocurrency",
    titleKey: "payCrypto",
    description:
      "Place your order, then pay on MakePay's secure hosted page. Your order is confirmed as soon as the network confirms your payment.",
  },
  [PAYPAL_PROVIDER_ID]: {
    icon: "wallet",
    title: "PayPal",
    description:
      "Approve securely with PayPal. Your order is placed after payment is confirmed.",
  },
}

/** Providers whose session is bound to one amount, so choosing them always starts a fresh session. */
function needsFreshSession(providerId: string) {
  return isPaygate(providerId) || providerId === MAKEPAY_PROVIDER_ID || providerId === PAYPAL_PROVIDER_ID || providerId === NMI_PROVIDER_ID
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

function countryName(code: string | null | undefined, locale: string) {
  return code && /^[a-z]{2}$/i.test(code) ? new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase() : ""
}

type OptionType = { code?: string | null; description?: string | null }
const optionType = (option: HttpTypes.StoreCartShippingOption) => (option as { type?: OptionType }).type

/** Delivery days stated on the shipping option, e.g. "3–5 business days." */
function deliveryDays(description?: string | null) {
  const match = description?.match(/(\d+)\s*(?:[–-]\s*(\d+)\s*)?business days?/i)
  return match ? { min: Number(match[1]), max: Number(match[2] ?? match[1]) } : null
}

function addBusinessDays(from: Date, days: number) {
  const date = new Date(from)
  for (let left = days; left > 0; ) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0 && date.getDay() !== 6) left -= 1
  }
  return date
}

/** The arrival window in the shopper's own date format, e.g. "Thu, 6 Nov – Mon, 10 Nov". */
function arrivalWindow(description: string | null | undefined, locale: string) {
  const days = deliveryDays(description)
  if (!days) return null
  const today = new Date()
  const format = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" })
  return days.min === days.max
    ? format.format(addBusinessDays(today, days.min))
    : format.formatRange(addBusinessDays(today, days.min), addBusinessDays(today, days.max))
}

function selectableSx(selected: boolean) {
  return {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    minWidth: 0,
    overflowWrap: "anywhere",
    alignItems: "center",
    gap: 1,
    width: "100%",
    border: "1px solid",
    borderColor: selected ? "secondary.main" : "brand.lineStrong",
    bgcolor: selected ? "#eff5f6" : "#fff",
    borderRadius: 2.5,
    p: 1.5,
    pr: 2,
    cursor: "pointer",
    transition: "border-color .15s, background-color .15s",
    "&:hover": { borderColor: "secondary.main" },
    "&:focus-within": { outline: "2px solid", outlineColor: "secondary.main", outlineOffset: 2 },
  } as const
}

export default function CheckoutFlow() {
  return <Suspense fallback={<Skeleton variant="rounded" height={420} />}><CheckoutRoute /></Suspense>
}

function CheckoutRoute() {
  const params = useSearchParams()
  // The module's full-page fallback returns to /checkout?token=… . Use the same
  // verified capture/completion flow as the dedicated PayPal return page.
  return params.get("token") ? <PayPalReturn /> : <CheckoutContent />
}

function CheckoutContent() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const { cart, cartReady } = useStore()
  const { customer, loading: accountLoading } = useAccount()
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)

  if (completedOrderId) {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress color="secondary" />
        <Typography>{ct("Order placed. Opening your confirmation…")}</Typography>
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
          {ct("Your cart is empty.")}
        </Typography>
        <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
          {act("shopCatalog")}
        </ButtonLink>
      </Stack>
    )
  }

  // An account is required to order: there is no guest checkout.
  if (!customer) {
    return <AuthPanel context="checkout" />
  }

  return <Checkout cart={cart} customer={customer} onCompleted={setCompletedOrderId} />
}

function Checkout({ cart, customer, onCompleted }: { cart: HttpTypes.StoreCart; customer: HttpTypes.StoreCustomer; onCompleted: (orderId: string) => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Checkout")
  const locale = useLocale()
  const money = useMoney()
  const router = useRouter()
  const { setCart, clearCart, linkCustomerCart, isCurrentCart, deliveryCountries, countryCode } = useStore()
  // Delivery goes anywhere in the world, not only to the countries the site is set up for.
  const countries = useMemo(() => deliveryCountries.map((code) => ({ code, name: code.toUpperCase() })), [deliveryCountries])
  const { createAddress, updateAddress, captureSession } = useAccount()
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  // Each list remembers what it was loaded for, so a stale list is never shown or acted on.
  const [loadedOptions, setLoadedOptions] = useState<{ key: string; list: HttpTypes.StoreCartShippingOption[] } | null>(null)
  const [loadedProviders, setLoadedProviders] = useState<{ key: string; list: HttpTypes.StorePaymentProvider[] } | null>(null)
  const [loadedPayPal, setLoadedPayPal] = useState<{ key: string; config: PayPalConfig | null } | null>(null)
  const payPalAttempt = useRef<{ id: string; fingerprint: string; assertCurrent: () => void } | null>(null)
  const sessions = cart.payment_collection?.payment_sessions ?? []
  const [wantedProvider, setWantedProvider] = useState(sessions[0]?.provider_id ?? "")
  const attempted = useRef({ delivery: "", payment: "" })

  const currency = cart.currency_code
  const address = cart.shipping_address
  const hasAddress = Boolean(cart.email && address?.address_1 && countries.some(country => country.code === address.country_code?.toLowerCase()) && !Object.keys(validateAddress(toAddressValues(address))).length)
  const method = cart.shipping_methods?.[0]
  const hasDelivery = hasAddress && Boolean(method)
  const addressKey = [address?.country_code, address?.postal_code, address?.address_1].join("|")
  const optionsKey = [cart.id, cart.region_id, addressKey, cart.item_total].join("|")
  const providersKey = [cart.id, cart.region_id, cart.currency_code].join("|")
  const payPalConfig = loadedPayPal?.key === providersKey ? loadedPayPal.config : null
  const options = loadedOptions?.key === optionsKey ? loadedOptions.list : null
  const providers = loadedProviders?.key === providersKey ? loadedProviders.list : null
  const onlyProvider = providers?.length === 1 ? providers[0].id : ""
  const chosenProvider = providers?.some((provider) => provider.id === wantedProvider) ? wantedProvider : onlyProvider
  const activeSession = sessions.find((session) => session.provider_id === chosenProvider)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [error])

  // Delivery options depend on the destination, so they reload when the address changes.
  useEffect(() => {
    if (!hasAddress) return
    let cancelled = false
    sdk.store.fulfillment
      .listCartOptions({ cart_id: cart.id })
      .then(({ shipping_options }) => {
        if (!cancelled) setLoadedOptions({ key: optionsKey, list: shipping_options.filter(hasShippingPrice) })
      })
      .catch((err) => {
        if (cancelled) return
        setLoadedOptions({ key: optionsKey, list: [] })
        setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [hasAddress, cart.id, optionsKey])

  useEffect(() => {
    if (!hasDelivery) return
    let cancelled = false
    Promise.all([
      sdk.store.payment.listPaymentProviders({ region_id: cart.region_id ?? "" }),
      sdk.client.fetch<NmiConfig>("/store/nmi/config", { method: "GET", cache: "no-store" }).catch(() => null),
      sdk.client.fetch<PayPalConfig>("/store/paypal/config", { method: "GET", query: { cart_id: cart.id }, cache: "no-store" }).catch(() => null),
      sdk.client.fetch<PaygateConfig>("/store/paygate/config", { method: "GET", cache: "no-store" }).catch(() => null),
    ])
      .then(([{ payment_providers }, config, paypal, paygate]) => {
        if (cancelled) return
        setLoadedPayPal({ key: providersKey, config: paypal })
        setLoadedProviders({ key: providersKey, list: payment_providers.filter((provider) => {
          if (!isCheckoutPaymentProvider(provider.id)) return false
          if (isPaygate(provider.id)) return paygateAvailable(paygate, provider.id)
          if (provider.id === PAYPAL_PROVIDER_ID) return payPalAvailable(paypal, cart.currency_code)
          return provider.id !== NMI_PROVIDER_ID || nmiAvailable(config, cart.currency_code)
        }) })
      })
      .catch((err) => {
        if (cancelled) return
        setLoadedProviders({ key: providersKey, list: [] })
        setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [hasDelivery, cart.id, cart.region_id, cart.currency_code, providersKey])

  const guard = async (task: (assertCurrent: () => void) => Promise<void>) => {
    if (busyRef.current) return false
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
      return true
    } catch (err) {
      setError(errorMessage(err))
      return false
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const saveAddress = (body: AddressBody) =>
    guard(async (assertCurrent) => {
      await linkCustomerCart()
      assertCurrent()
      const { saveToAccount, savedAddressId, email: nextEmail, ...addresses } = body
      if (nextEmail && nextEmail !== cart.email) {
        await sdk.store.cart.update(cart.id, { email: nextEmail })
        assertCurrent()
      }
      // Any country we sell to, in the currency the shopper chose: the cart keeps its currency.
      const { cart: updated } = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(`/store/carts/${cart.id}/delivery-address`, {
        method: "POST",
        body: addresses,
        query: { fields: CART_FIELDS },
      })
      assertCurrent()
      setCart(updated)
      if (saveToAccount) {
        if (savedAddressId) {
          await updateAddress(savedAddressId, body.shipping_address)
        } else {
          const first = !customer.addresses?.length
          await createAddress({ ...body.shipping_address, ...(first ? { address_name: "Primary shipping", is_default_shipping: true } : {}) })
        }
        assertCurrent()
      }
    })

  const chooseDelivery = (optionId: string) =>
    guard(async (assertCurrent) => {
      const { cart: updated } = await sdk.store.cart.addShippingMethod(cart.id, { option_id: optionId }, { fields: CART_FIELDS })
      assertCurrent()
      setCart(updated)
    })

  const startPayment = (providerId: string) => {
    attempted.current.payment = `${providerId}:${cart.total}`
    return guard(async (assertCurrent) => {
      const checkoutCart = await linkCustomerCart()
      assertCurrent()
      const existing = checkoutCart.payment_collection?.payment_sessions?.find((session) => session.provider_id === providerId)
      if (needsFreshSession(providerId) || !existing) {
        await sdk.store.payment.initiatePaymentSession(checkoutCart, {
          provider_id: providerId,
          data: providerId === MAKEPAY_PROVIDER_ID && checkoutCart.email ? { customer_email: checkoutCart.email } : undefined,
        })
        assertCurrent()
      }
      const { cart: updated } = await sdk.store.cart.retrieve(cart.id, { fields: CART_FIELDS })
      assertCurrent()
      setCart(updated)
    })
  }

  const choosePayment = (providerId: string) => {
    setWantedProvider(providerId)
    void startPayment(providerId)
  }

  // Preselect the cheapest delivery once the destination is known; the shopper can still switch.
  const cheapest = options?.length ? options.reduce((best, option) => (Number(option.amount) < Number(best.amount) ? option : best)) : null
  useEffect(() => {
    if (!hasAddress || method || !cheapest || busyRef.current) return
    const key = `${cart.id}:${addressKey}`
    if (attempted.current.delivery === key) return
    attempted.current.delivery = key
    void chooseDelivery(cheapest.id)
  })

  // With a single payment method, choose it. A changed total voids the payment session, so
  // the chosen method is prepared again for the new amount.
  useEffect(() => {
    if (!hasDelivery || busyRef.current || !chosenProvider || activeSession) return
    if (attempted.current.payment === `${chosenProvider}:${cart.total}`) return
    void startPayment(chosenProvider)
  })

  const createPayPalOrder = async () => {
    let orderId = ""
    await guard(async (assertCurrent) => {
      const checkoutCart = await linkCustomerCart()
      assertCurrent()
      if (payPalCartFingerprint(checkoutCart) !== payPalCartFingerprint(cart)) {
        setCart(checkoutCart)
        throw new Error("Your checkout changed. Review your order before paying with PayPal.")
      }
      const result = await sdk.client.fetch<{ id: string }>("/store/paypal/create-order", {
        method: "POST", body: { cart_id: cart.id }, headers: { "Idempotency-Key": crypto.randomUUID() },
      })
      assertCurrent()
      if (!result.id) throw new Error("PayPal could not prepare your payment. Please try again.")
      orderId = result.id
      payPalAttempt.current = { id: orderId, fingerprint: payPalCartFingerprint(checkoutCart), assertCurrent }
    })
    if (!orderId) throw new Error("Review your checkout before paying with PayPal.")
    return orderId
  }

  const placeOrder = (nmiToken?: NmiToken, confirmPayPal?: () => Promise<void>) =>
    guard(async (assertCurrent) => {
      let checkoutCart = await linkCustomerCart()
      assertCurrent()
      if (Number(checkoutCart.total) !== Number(cart.total)) {
        throw new Error("Your account pricing has been applied. Please review the updated total before paying.")
      }
      const isNmi = checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === NMI_PROVIDER_ID)
      if (isNmi || nmiToken) {
        if (!isNmi || !nmiToken || nmiCartFingerprint(checkoutCart) !== nmiCartFingerprint(cart)) {
          setCart(checkoutCart)
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
          throw new Error("Your total or delivery details changed. Review the order before paying.")
        }
        checkoutCart = refreshed
      }
      if (chosenProvider === PAYPAL_PROVIDER_ID) {
        if (!confirmPayPal || payPalAttempt.current?.fingerprint !== payPalCartFingerprint(checkoutCart)) {
          setCart(checkoutCart)
          throw new Error("Your checkout changed. Review your order and approve the PayPal payment again.")
        }
        payPalAttempt.current.assertCurrent()
        await confirmPayPal()
        assertCurrent()
      }
      // Validate hosted redirects before reserving the order, then open the payment page.
      const isMakePay = checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === MAKEPAY_PROVIDER_ID)
      const redirect = isMakePay ? readMakePayRedirect(checkoutCart) : null
      const paygateRedirect = isPaygate(chosenProvider) ? readPaygateRedirect(checkoutCart) : null
      const result = await sdk.store.cart.complete(checkoutCart.id)
      assertCurrent()
      if (result.type !== "order") {
        throw new Error(result.error?.message ?? "We couldn't place your order. Please review your details.")
      }
      try {
        const receipt = serializeOrderReceipt(result.order, customer.id)
        if (receipt) window.sessionStorage.setItem(`vetud_order_${result.order.id}`, receipt)
      } catch {
        // The confirmation page fetches the order when storage is unavailable.
      }
      if (paygateRedirect) {
        onCompleted(result.order.id)
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
        onCompleted(result.order.id)
        clearCart()
        window.location.assign(redirect.url)
        return
      }
      onCompleted(result.order.id)
      clearCart()
      router.push(`/${countryCode}/order/confirmed?id=${encodeURIComponent(result.order.id)}`)
    })

  const selectedOption = options?.find((option) => option.id === method?.shipping_option_id)
  const place = address?.country_code
    ? [address.city, countryName(address.country_code, locale)].filter(Boolean).join(", ")
    : ""
  const summaryProps = { cart, place: hasAddress ? place : "", arrival: selectedOption ? arrivalWindow(optionType(selectedOption)?.description, locale) : null }

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        {/* On small screens the summary sidebar would sit below the form, so the total stays visible up top. */}
        <Accordion disableGutters sx={{ display: { md: "none" }, mb: 3, px: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "none", "&::before": { display: "none" } }}>
          <AccordionSummary expandIcon={<Icon name="chevronDown" />} aria-controls="checkout-summary-content" id="checkout-summary-header" sx={{ minHeight: 64, "& .MuiAccordionSummary-content": { my: 2 } }}>
            <Typography sx={{ fontWeight: 600, flex: 1 }}>{t("summary")}</Typography>
            <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{ct(money(Number(cart.total ?? 0), currency))}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}><CheckoutOrderSummary {...summaryProps} compact /></AccordionDetails>
        </Accordion>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="p" sx={{ fontWeight: 600 }}>
            {customer.first_name ? t("greeting", { name: customer.first_name }) : t("greetingPlain")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {t("greetingHelp")}
          </Typography>
        </Box>

        {error ? (
          <Alert ref={errorRef} severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {ct(error)}
          </Alert>
        ) : null}

        <Stack spacing={2}>
          <AddressSection
            key={`${cart.id}:${customer.id}`}
            cart={cart}
            customer={customer}
            countries={countries}
            defaultCountry={countries.some((country) => country.code === countryCode) ? countryCode : countries[0]?.code ?? ""}
            busy={busy}
            onSubmit={saveAddress}
          />
          <DeliverySection cart={cart} options={hasAddress ? options : null} locked={!hasAddress} place={place} busy={busy} onSelect={chooseDelivery} />
          <Step index={3} title={t("payment")} done={false} locked={!hasDelivery} lockedHint={t("paymentLocked")}>
            {providers === null ? (
              <Stack spacing={1.25}>
                <Skeleton variant="rounded" height={64} />
                <Skeleton variant="rounded" height={64} />
              </Stack>
            ) : providers.length ? (
              <>
                <RadioGroup name="payment_method" value={chosenProvider} onChange={(event) => choosePayment(event.target.value)} aria-label={t("payment")}>
                  <Stack spacing={1.25}>
                    {providers.map((provider) => {
                      const label = PAYMENT_LABELS[provider.id] ?? { title: provider.id, description: "" }
                      const selected = chosenProvider === provider.id
                      return (
                        <Box key={provider.id} component="label" sx={{ ...selectableSx(selected), alignItems: "flex-start" }}>
                          <Radio value={provider.id} disabled={busy} sx={{ mt: -0.25 }} />
                          <Box sx={{ flex: 1, py: 0.75 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                              <Icon name={label.icon ?? "lock"} fontSize="small" sx={{ color: "secondary.main" }} />
                              <Typography sx={{ fontWeight: 600 }}>{ct(label.titleKey ? t(label.titleKey) : translateAction(act, label.title))}</Typography>
                            </Stack>
                            {selected && label.description ? (
                              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                                {translateAction(act, label.description)}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>
                </RadioGroup>
                {chosenProvider ? (
                  activeSession ? (
                    <PayPanel cart={cart} provider={chosenProvider} busy={busy} onRefresh={() => void startPayment(chosenProvider)} onPlaceOrder={() => void placeOrder()} onNmiToken={async (token) => { await placeOrder(token) }} payPalConfig={payPalConfig} createPayPalOrder={createPayPalOrder} onPayPalApprove={async (orderId) => {
                      await placeOrder(undefined, async () => {
                        const attempt = payPalAttempt.current
                        if (!attempt || attempt.id !== orderId) throw new Error("This PayPal payment does not match your checkout.")
                        attempt.assertCurrent()
                        await sdk.client.fetch("/store/paypal/capture-order", { method: "POST", body: { cart_id: cart.id, order_id: orderId } })
                        attempt.assertCurrent()
                      })
                    }} />
                  ) : (
                    <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: "center", color: "text.secondary" }}>
                      {busy ? <CircularProgress size={18} color="secondary" /> : null}
                      <Typography variant="body2">{ct(busy ? t("preparingPayment") : t("paymentRetry"))}</Typography>
                      {busy ? null : (
                        <Button size="small" color="secondary" onClick={() => void startPayment(chosenProvider)}>
                          {t("tryAgain")}
                        </Button>
                      )}
                    </Stack>
                  )
                ) : null}
              </>
            ) : (
              <Alert severity="warning">{t("noPayment", { email: SITE.email })}</Alert>
            )}
          </Step>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: "none", md: "block" } }}>
        <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", borderRadius: 3, position: "sticky", top: 110 }}>
          <CheckoutOrderSummary {...summaryProps} />
        </Paper>
      </Grid>
    </Grid>
  )
}

/** One numbered checkout section. Locked sections show only their title and what unlocks them. */
function Step({
  index,
  title,
  done,
  locked,
  lockedHint,
  action,
  children,
}: {
  index: number
  title: string
  done: boolean
  locked: boolean
  lockedHint?: string
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  const ct = useContentTranslator()
  return (
    <Paper component="section" variant="outlined" aria-label={ct(title)} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, bgcolor: locked ? "brand.paper" : "#fff" }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Box
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 700,
            bgcolor: done ? "secondary.main" : locked ? "brand.line" : "primary.main",
            color: locked && !done ? "text.secondary" : "#fff",
          }}
        >
          {done ? <Icon name="check" sx={{ fontSize: 16 }} /> : index}
        </Box>
        <Typography variant="h6" component="h2" sx={{ flex: 1, fontWeight: 600, color: locked ? "text.secondary" : "text.primary" }}>
          {ct(title)}
        </Typography>
        {ct(action)}
      </Stack>
      {locked ? (
        lockedHint ? (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, pl: 5.5 }}>
            {ct(lockedHint)}
          </Typography>
        ) : null
      ) : children ? (
        <Box sx={{ mt: 2.5, pl: { sm: 5.5 } }}>{children}</Box>
      ) : null}
    </Paper>
  )
}

type AddressBody = {
  email: string
  shipping_address: AddressValues
  saveToAccount: boolean
  savedAddressId?: string
}

function AddressSection({ cart, customer, countries, defaultCountry, busy, onSubmit }: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer
  countries: { code: string; name: string }[]
  defaultCountry: string
  busy: boolean
  onSubmit: (body: AddressBody) => Promise<boolean>
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Checkout")
  const ta = useTranslations("Address")
  const locale = useLocale()
  const savedAddresses = customer.addresses ?? []
  const defaultAddress = savedAddresses.find(address => address.id === customer.default_shipping_address_id)
    ?? savedAddresses.find(address => address.is_default_shipping)
  const preferred = defaultAddress ?? savedAddresses[0]
  const current = cart.shipping_address?.address_1 ? cart.shipping_address : null
  const email = cart.email || customer.email
  const withProfile = (address?: Parameters<typeof toAddressValues>[0]): AddressValues => {
    const values = toAddressValues(address)
    return { ...values, first_name: values.first_name || customer.first_name || "", last_name: values.last_name || customer.last_name || "", phone: values.phone || customer.phone || "", country_code: values.country_code || defaultCountry }
  }
  const errorsFor = (values: AddressValues) => {
    const errors = validateAddress(values, (key, args) => ta(key, args), ta(getCountryRules(values.country_code).postalLabel as "postal" | "zip" | "postcode"))
    if (!countries.some(country => country.code === values.country_code)) errors.country_code = ta("unsupportedCountry")
    return errors
  }
  const initialSource = current ?? preferred
  const initialId = current ? savedAddresses.find(address => sameAddress(withProfile(address), current))?.id ?? "current" : preferred?.id ?? "new"
  const [selectedId, setSelectedId] = useState(initialId)
  const [shipping, setShipping] = useState(() => withProfile(initialSource))
  const [mode, setMode] = useState<"summary" | "choose" | "repair" | "edit" | "new">(() => !initialSource ? "new" : Object.keys(errorsFor(shipping)).length ? "repair" : "summary")
  const [repairFields, setRepairFields] = useState(() => addressRepairFields(errorsFor(shipping)))
  const [showErrors, setShowErrors] = useState(Boolean(initialSource))
  const [saveToAccount, setSaveToAccount] = useState(true)
  const autoApplied = useRef(false)
  const shippingErrors = errorsFor(shipping)
  const valid = Object.keys(shippingErrors).length === 0
  const selectedSaved = savedAddresses.find(address => address.id === selectedId)
  const isApplied = Boolean(current && cart.email && valid && sameAddress(shipping, current))
  const isEditor = mode === "repair" || mode === "edit" || mode === "new"

  const bodyFor = (values: AddressValues, persist = false, addressId = selectedId): AddressBody => ({
    email, shipping_address: normalizeAddress(values), saveToAccount: persist,
    ...(savedAddresses.some(address => address.id === addressId) ? { savedAddressId: addressId } : {}),
  })

  // A complete default address can be used immediately. Repairs always need confirmation.
  useEffect(() => {
    if (autoApplied.current || current || !preferred || mode !== "summary") return
    autoApplied.current = true
    if (valid) void onSubmit(bodyFor(shipping))
  })

  const openChoose = () => {
    autoApplied.current = true
    const match = savedAddresses.find(address => sameAddress(withProfile(address), shipping))
    if (match) setSelectedId(match.id)
    else if (current && sameAddress(current, shipping)) setSelectedId("current")
    setMode("choose")
  }
  const pick = (id: string) => {
    if (busy) return
    autoApplied.current = true
    const source = id === "current" ? current : savedAddresses.find(address => address.id === id)
    const values = withProfile(source)
    const errors = errorsFor(values)
    setSelectedId(id)
    setShipping(values)
    setRepairFields(addressRepairFields(errors))
    setShowErrors(id !== "new")
    setSaveToAccount(true)
    setMode(id === "new" ? "new" : Object.keys(errors).length ? "repair" : "summary")
    if (id !== "new" && !Object.keys(errors).length && !(cart.email && sameAddress(values, current))) void onSubmit(bodyFor(values, false, id))
  }
  const openEditor = (full = false) => {
    const match = savedAddresses.find(address => sameAddress(withProfile(address), shipping))
    if (match) setSelectedId(match.id)
    else if (!selectedSaved && current) setSelectedId("current")
    setRepairFields(addressRepairFields(shippingErrors))
    setShowErrors(!valid)
    setSaveToAccount(true)
    setMode(full ? "edit" : "repair")
  }
  const cancelEditor = () => {
    const source = selectedSaved ?? current ?? preferred
    const values = withProfile(source)
    setShipping(values)
    setSelectedId(source?.id === current?.id ? "current" : source?.id ?? "new")
    setShowErrors(false)
    setMode(source ? "summary" : "new")
  }
  const change = (values: AddressValues) => {
    setShipping(values)
    // Once revealed, a field remains mounted while the shopper corrects it.
    if (mode === "repair") setRepairFields(previous => [...new Set([...previous, ...addressRepairFields(errorsFor(values))])])
  }
  const lines = (values: Parameters<typeof formatAddressLines>[0]) => [...formatAddressLines(values).slice(0, -1), countryName(values.country_code, locale)].filter(Boolean)

  return <Step index={1} title={t("shipping")} done={mode === "summary" && isApplied} locked={false} action={
    (mode === "summary" || mode === "repair") ? <Button type="button" size="small" disabled={busy} onClick={openChoose} sx={{ minHeight: 44 }}>{t("change")}</Button> : undefined
  }>
    {(mode === "summary" || mode === "repair") ? <Box sx={{ mb: 2.5, overflowWrap: "anywhere" }}>
      {lines(shipping).map((line, index) => <Typography key={index} variant="body2" sx={{ fontWeight: index === 0 ? 650 : 400, color: index === 0 ? "text.primary" : "text.secondary" }}>{line}</Typography>)}
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 1.5 }}>{t("confirmationTo", { email })}</Typography>
      {mode === "summary" ? <Button type="button" size="small" disabled={busy} onClick={() => openEditor(true)} sx={{ px: 0, mt: 0.5, minHeight: 44 }}>{ct("Edit address")}</Button> : null}
    </Box> : null}

    {mode === "choose" ? <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">{ct("Where should we deliver your order?")}</Typography>
      <RadioGroup name="saved_address" value={selectedId} onChange={event => pick(event.target.value)} aria-label={t("savedAddress")}>
        <Stack spacing={1.25}>
          {savedAddresses.map(address => {
            const name = [address.first_name, address.last_name].filter(Boolean).join(" ") || t("savedAddress")
            return <Box key={address.id} component="label" sx={{ ...selectableSx(selectedId === address.id), alignItems: "start", cursor: busy ? "default" : "pointer" }}>
              <Radio value={address.id} disabled={busy} onClick={() => { if (address.id === selectedId) pick(address.id) }} sx={{ minHeight: 44, minWidth: 44 }} />
              <Box sx={{ py: 0.75, minWidth: 0 }}>
                <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap", alignItems: "center", mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 650 }}>{name}</Typography>
                  {address.id === defaultAddress?.id ? <Chip size="small" label={t("defaultAddress")} sx={{ height: 22, fontSize: 11 }} /> : null}
                </Stack>
                {lines({ ...address, first_name: "", last_name: "" }).map((line, index) => <Typography key={index} variant="body2" color="text.secondary">{line}</Typography>)}
              </Box>
            </Box>
          })}
          {current && !savedAddresses.some(address => sameAddress(withProfile(address), current)) ? <Box component="label" sx={selectableSx(selectedId === "current")}>
            <Radio value="current" disabled={busy} onClick={() => { if (selectedId === "current") pick("current") }} />
            <Box><Typography sx={{ fontWeight: 650 }}>{ct("Current order address")}</Typography>{lines(current).map((line, index) => <Typography key={index} variant="body2" color="text.secondary">{line}</Typography>)}</Box>
          </Box> : null}
        </Stack>
      </RadioGroup>
      <Button type="button" variant="outlined" disabled={busy} onClick={() => pick("new")} startIcon={<Icon name="plus" />} sx={{ minHeight: 48, justifyContent: "flex-start", "&:hover": { transform: "none" } }}>{t("addAddress")}</Button>
      {initialSource ? <Button type="button" disabled={busy} onClick={() => setMode("summary")} sx={{ alignSelf: "flex-start", minHeight: 44 }}>{t("cancel")}</Button> : null}
    </Stack> : null}

    {isEditor ? <Box component="form" noValidate onSubmit={event => {
      event.preventDefault()
      if (busy) return
      setShowErrors(true)
      if (!valid) {
        const field = `shipping-${Object.keys(shippingErrors)[0]}`
        const control = event.currentTarget.querySelector<HTMLElement>(`[id="${field}"]`) ?? event.currentTarget.querySelector<HTMLElement>(`[name="${field}"]`)
        control?.focus()
        return
      }
      void onSubmit(bodyFor(shipping, saveToAccount && (mode === "new" || Boolean(selectedSaved)))).then(ok => { if (ok) setMode("summary") })
    }}>
      <Box id="shipping-address-editor" component="fieldset" disabled={busy} inert={busy} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ p: 0, mb: 1, fontWeight: 650 }}>{ct(mode === "new" ? "New shipping address" : mode === "repair" ? "Confirm delivery details" : "Edit selected address")}</Typography>
        {mode === "repair" ? <Typography variant="body2" sx={{ mb: 2.5, color: "text.secondary" }}>{ct("Your saved details are filled in. Check the highlighted fields to continue.")}</Typography> : null}
        <AddressFields prefix="shipping" values={shipping} errors={showErrors ? shippingErrors : {}} countries={countries} onChange={change} fields={mode === "repair" ? repairFields : undefined} showAutofillHint={false} />
        {mode === "new" || selectedSaved ? <FormControlLabel sx={{ mt: 1.5, alignItems: "flex-start", "& .MuiFormControlLabel-label": { pt: 1, fontSize: "0.8125rem" } }} control={<Checkbox checked={saveToAccount} disabled={busy} onChange={event => setSaveToAccount(event.target.checked)} />} label={mode === "new" ? t("save") : ct("Save these changes to my saved address")} /> : null}
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}>{ct("Save and continue")}</Button>
        {mode === "repair" ? <Button type="button" disabled={busy} onClick={() => openEditor(true)}>{ct("Edit all details")}</Button> : (initialSource || savedAddresses.length) ? <Button type="button" disabled={busy} onClick={cancelEditor}>{t("cancel")}</Button> : null}
      </Stack>
    </Box> : null}

    {mode === "summary" && !isApplied ? <Button type="button" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} onClick={() => { if (valid) void onSubmit(bodyFor(shipping)); else openEditor() }}>{valid ? t("useAddress") : ct("Review address")}</Button> : null}
  </Step>
}

function DeliverySection({
  cart,
  options,
  locked,
  place,
  busy,
  onSelect,
}: {
  cart: HttpTypes.StoreCart
  options: HttpTypes.StoreCartShippingOption[] | null
  locked: boolean
  place: string
  busy: boolean
  onSelect: (optionId: string) => void
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Checkout")
  const locale = useLocale()
  const money = useMoney()
  const selected = cart.shipping_methods?.[0]?.shipping_option_id ?? ""
  const name = (option: HttpTypes.StoreCartShippingOption) => {
    const code = optionType(option)?.code
    return code === "standard" ? t("standardName") : code === "express" ? t("expressName") : option.name
  }

  return (
    <Step index={2} title={t("delivery")} done={Boolean(selected)} locked={locked} lockedHint={t("deliveryLocked")}>
      {place ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary", mb: 2 }}>
          <Icon name="truck" fontSize="small" sx={{ color: "secondary.main" }} />
          <Typography variant="body2">{t("deliveringTo", { place })}</Typography>
        </Stack>
      ) : null}
      {options === null ? (
        <Stack spacing={1.25}>
          <Skeleton variant="rounded" height={68} />
          <Skeleton variant="rounded" height={68} />
        </Stack>
      ) : options.length ? (
        <RadioGroup name="delivery_method" value={selected} onChange={(event) => onSelect(event.target.value)} aria-label={t("delivery")}>
          <Stack spacing={1.25}>
            {options.map((option) => {
              const amount = Number(option.amount)
              const description = optionType(option)?.description
              const arrival = arrivalWindow(description, locale)
              const tracked = /tracked/i.test(description ?? "")
              return (
                <Box key={option.id} component="label" sx={{ ...selectableSx(selected === option.id), gridTemplateColumns: "auto minmax(0, 1fr) auto" }}>
                  <Radio value={option.id} disabled={busy} />
                  <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 600 }}>{ct(name(option))}</Typography>
                      {tracked ? <Chip label={t("tracked")} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} /> : null}
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {ct(arrival ? t("arrives", { date: arrival }) : description)}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {ct(amount === 0 ? t("free") : money(amount, cart.currency_code))}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </RadioGroup>
      ) : (
        <Alert severity="warning">{t("noDelivery", { email: SITE.email })}</Alert>
      )}
    </Step>
  )
}

function PayPanel({
  cart,
  provider,
  busy,
  onRefresh,
  onPlaceOrder,
  onNmiToken,
  payPalConfig,
  createPayPalOrder,
  onPayPalApprove,
}: {
  cart: HttpTypes.StoreCart
  provider: string
  busy: boolean
  onRefresh: () => void
  onPlaceOrder: () => void
  onNmiToken: (token: NmiToken) => Promise<void>
  payPalConfig: PayPalConfig | null
  createPayPalOrder: () => Promise<string>
  onPayPalApprove: (orderId: string) => Promise<void>
}) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const money = useMoney()
  const total = money(Number(cart.total ?? 0), cart.currency_code)
  const nmiSession = provider === NMI_PROVIDER_ID ? readNmiSession(cart) : null

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
      {provider === NMI_PROVIDER_ID ? (
        nmiSession ? <NmiPaymentForm key={`${nmiSession.id}:${nmiCartFingerprint(cart)}`} session={nmiSession} busy={busy} onToken={onNmiToken} />
          : <Alert severity="warning" action={<Button onClick={onRefresh}>{act("refresh")}</Button>}>{ct("Your secure payment session needs refreshing.")}</Alert>
      ) : provider === PAYPAL_PROVIDER_ID ? (
        payPalConfig ? <PayPalPaymentForm key={`${cart.id}:${payPalConfig.client_id}:${payPalConfig.currency}:${payPalConfig.intent}`} config={payPalConfig} busy={busy} createOrder={createPayPalOrder} onApprove={onPayPalApprove} />
          : <Alert severity="warning">{ct("PayPal is unavailable. Please choose another payment method.")}</Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={onPlaceOrder}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
          sx={{ minWidth: { xs: 0, sm: 260 }, width: { xs: "100%", sm: "auto" } }}
        >
          {ct(busy
            ? provider === PAYPAL_PROVIDER_ID
              ? act("openingPayPal")
              : act("placingOrder")
            : act("orderAmount", { action: provider === PAYPAL_PROVIDER_ID ? act("payPal") : act("placeOrder"), amount: total }))}
        </Button>
      )}
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 2, fontSize: 13 }}>
        {ct(provider === NMI_PROVIDER_ID
          ? "By authorizing payment and placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. Cards are captured when ready to dispatch. Bank debits must settle before dispatch."
          : provider === PAYPAL_PROVIDER_ID
          ? "By paying with PayPal you agree to our terms of sale and confirm the products are for laboratory research use only. We ship after payment is confirmed."
          : isPaygate(provider)
          ? "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. Continue to PayGate to pay. You can resume an unpaid payment from your order history. We ship after payment is verified."
          : provider === MAKEPAY_PROVIDER_ID
          ? "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will be taken to MakePay to complete your payment; we ship as soon as it is confirmed."
          : "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will receive payment instructions by email; we ship as soon as payment is received.")}
      </Typography>
    </Box>
  )
}
