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
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useEffect, useMemo, useRef, useState } from "react"
import { MAKEPAY_PROVIDER_ID, MAKEPAY_STORAGE, readMakePayRedirect } from "@/lib/makepay"
import { SITE } from "@/lib/config"
import { sdk } from "@/lib/medusa/sdk"
import { PAYPAL_PROVIDER_ID, readPayPalRedirect } from "@/lib/paypal"
import { useMoney } from "@/lib/money"
import { serializeOrderReceipt } from "@/lib/order-receipt"
import { NMI_PROVIDER_ID, nmiAvailable, nmiCartFingerprint, readNmiSession, type NmiConfig, type NmiToken } from "@/lib/nmi"
import { PAYGATE_CARD, PAYGATE_CRYPTO, isPaygate, readPaygateRedirect, type PaygateConfig } from "@/lib/paygate"
import { STRIPE_PROVIDER_ID, readStripeClientSecret, stripeBillingDetails, stripeEnabled } from "@/lib/stripe"
import { AuthPanel } from "../account/AccountPage"
import { useAccount } from "../account/AccountProvider"
import CartLineItem from "../cart/CartLineItem"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"
import { CART_FIELDS, useStore } from "../store/StoreProvider"
import AddressFields, { EMPTY_ADDRESS, toAddressValues, validateAddress, type AddressValues } from "./AddressFields"

const NmiPaymentForm = dynamic(() => import("./NmiPaymentForm"), { ssr: false, loading: () => <Skeleton variant="rounded" height={240} /> })
const StripePaymentForm = dynamic(() => import("./StripePaymentForm"), { ssr: false, loading: () => <Skeleton variant="rounded" height={240} /> })

/** `titleKey` names the translated title in the Checkout messages; descriptions stay in English. */
const PAYMENT_LABELS: Record<string, { title: string; titleKey?: "payCard" | "payBank" | "payCrypto"; description: string; icon?: IconName }> = {
  [PAYGATE_CARD]: {
    icon: "card", title: "Credit / debit card on PayGate.to",
    description: "Reserve your order, then leave Vetud to choose a card provider such as MoonPay on PayGate.to. You enter card details on the provider's website. Fees and any identity checks are shown before you pay. We ship after payment is confirmed.",
  },
  [PAYGATE_CRYPTO]: {
    icon: "coin", title: "Cryptocurrency via PayGate.to",
    description: "Reserve your order, then choose a coin and network on hosted checkout. Send the exact quoted amount above the displayed network minimum. Network fees are shown there.",
  },
  [NMI_PROVIDER_ID]: {
    icon: "card",
    title: "Credit / debit card or eligible bank account",
    description: "Enter payment details securely below. Cards are authorized now and captured when ready to ship. Bank debit is available only when enabled and must settle before shipment.",
  },
  [STRIPE_PROVIDER_ID]: {
    icon: "card",
    title: "Credit / debit card",
    titleKey: "payCard",
    description: "Pay securely by card with Stripe. Your card is checked now and charged when your order is ready to ship.",
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
      "You'll be taken to PayPal to pay. Your order is placed as soon as the payment is confirmed.",
  },
}

/** Providers whose session is bound to one amount, so choosing them always starts a fresh session. */
function needsFreshSession(providerId: string) {
  return providerId === MAKEPAY_PROVIDER_ID || providerId === PAYPAL_PROVIDER_ID || providerId === NMI_PROVIDER_ID || providerId === STRIPE_PROVIDER_ID || isPaygate(providerId)
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

function countryName(code: string | null | undefined, locale: string) {
  return code ? new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase() : ""
}

function sameAddress(a?: Partial<Record<keyof AddressValues, string | null>> | null, b?: Partial<Record<keyof AddressValues, string | null>> | null) {
  const keys = ["first_name", "last_name", "address_1", "postal_code", "country_code"] as const
  return Boolean(a && b) && keys.every((key) => (a?.[key] ?? "").trim().toLowerCase() === (b?.[key] ?? "").trim().toLowerCase())
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
    display: "flex",
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
  const { cart, cartReady } = useStore()
  const { customer, loading: accountLoading } = useAccount()
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null)

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

  return <Checkout cart={cart} customer={customer} onCompleted={setCompletedOrderId} />
}

function Checkout({ cart, customer, onCompleted }: { cart: HttpTypes.StoreCart; customer: HttpTypes.StoreCustomer; onCompleted: (orderId: string) => void }) {
  const t = useTranslations("Checkout")
  const locale = useLocale()
  const money = useMoney()
  const router = useRouter()
  const { setCart, clearCart, linkCustomerCart, isCurrentCart, deliveryCountries, countryCode } = useStore()
  // Delivery goes anywhere in the world, not only to the countries the site is set up for.
  const countries = useMemo(() => deliveryCountries.map((code) => ({ code, name: code.toUpperCase() })), [deliveryCountries])
  const { createAddress, captureSession } = useAccount()
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  // Each list remembers what it was loaded for, so a stale list is never shown or acted on.
  const [loadedOptions, setLoadedOptions] = useState<{ key: string; list: HttpTypes.StoreCartShippingOption[] } | null>(null)
  const [loadedProviders, setLoadedProviders] = useState<{ key: string; list: HttpTypes.StorePaymentProvider[] } | null>(null)
  const sessions = cart.payment_collection?.payment_sessions ?? []
  const [wantedProvider, setWantedProvider] = useState(sessions[0]?.provider_id ?? "")
  const attempted = useRef({ delivery: "", payment: "" })

  const currency = cart.currency_code
  const address = cart.shipping_address
  const hasAddress = Boolean(cart.email && address?.address_1)
  const method = cart.shipping_methods?.[0]
  const hasDelivery = hasAddress && Boolean(method)
  const addressKey = [address?.country_code, address?.postal_code, address?.address_1].join("|")
  const optionsKey = [cart.id, cart.region_id, addressKey, cart.item_total].join("|")
  const providersKey = [cart.region_id, cart.currency_code].join("|")
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
        if (!cancelled) setLoadedOptions({ key: optionsKey, list: shipping_options })
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
      sdk.client.fetch<PaygateConfig>("/store/paygate/config", { method: "GET", cache: "no-store" }).catch(() => null),
    ])
      .then(([{ payment_providers }, config, paygate]) => {
        if (cancelled) return
        setLoadedProviders({ key: providersKey, list: payment_providers.filter((provider) => {
          if (provider.id === PAYGATE_CARD) return paygate?.card === true
          if (provider.id === PAYGATE_CRYPTO) return paygate?.crypto === true
          if (provider.id === STRIPE_PROVIDER_ID) return stripeEnabled
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
  }, [hasDelivery, cart.region_id, cart.currency_code, providersKey])

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
      const { saveToAccount, email: nextEmail, ...addresses } = body
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
        const first = !customer.addresses?.length
        await createAddress({ ...body.shipping_address, ...(first ? { address_name: "Primary shipping", is_default_shipping: true } : {}) })
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
  const cheapest = options?.length ? options.reduce((best, option) => (Number(option.amount ?? 0) < Number(best.amount ?? 0) ? option : best)) : null
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

  const placeOrder = (nmiToken?: NmiToken, confirmStripe?: () => Promise<void>) =>
    guard(async (assertCurrent) => {
      let checkoutCart = await linkCustomerCart()
      assertCurrent()
      if (Number(checkoutCart.total) !== Number(cart.total)) {
        throw new Error("Your account pricing has been applied. Please review the updated total before paying.")
      }
      // Stripe: confirm the card only once the total is known to be current, then create the order.
      if (checkoutCart.payment_collection?.payment_sessions?.some((session) => session.provider_id === STRIPE_PROVIDER_ID)) {
        if (!confirmStripe || readStripeClientSecret(checkoutCart) !== readStripeClientSecret(cart)) {
          setCart(checkoutCart)
          throw new Error("Your checkout changed. Review your order and enter your card details again.")
        }
        await confirmStripe()
        assertCurrent()
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
  const summary = (
    <OrderSummary
      cart={cart}
      place={hasAddress ? place : ""}
      arrival={selectedOption ? arrivalWindow(optionType(selectedOption)?.description, locale) : null}
    />
  )

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        {/* On small screens the summary sidebar would sit below the form, so the total stays visible up top. */}
        <Accordion disableGutters sx={{ display: { md: "none" }, mb: 3, px: 2, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: 3, boxShadow: "none", "&::before": { display: "none" } }}>
          <AccordionSummary expandIcon={<Icon name="chevronDown" />} aria-controls="checkout-summary-content" id="checkout-summary-header" sx={{ minHeight: 64, "& .MuiAccordionSummary-content": { my: 2 } }}>
            <Typography sx={{ fontWeight: 600, flex: 1 }}>{t("summary")}</Typography>
            <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{money(Number(cart.total ?? 0), currency)}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>{summary}</AccordionDetails>
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
            {error}
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
                              <Typography sx={{ fontWeight: 600 }}>{label.titleKey ? t(label.titleKey) : label.title}</Typography>
                            </Stack>
                            {selected && label.description ? (
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
                {chosenProvider ? (
                  activeSession ? (
                    <PayPanel cart={cart} provider={chosenProvider} busy={busy} onRefresh={() => void startPayment(chosenProvider)} onPlaceOrder={() => void placeOrder()} onNmiToken={async (token) => { await placeOrder(token) }} onStripePay={async (confirm) => { await placeOrder(undefined, confirm) }} />
                  ) : (
                    <Stack direction="row" spacing={1.5} sx={{ mt: 3, alignItems: "center", color: "text.secondary" }}>
                      {busy ? <CircularProgress size={18} color="secondary" /> : null}
                      <Typography variant="body2">{busy ? t("preparingPayment") : t("paymentRetry")}</Typography>
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
        <Paper variant="outlined" sx={{ p: 4, bgcolor: "brand.mintWash", borderRadius: 3, position: "sticky", top: 110 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
            {t("summary")}
          </Typography>
          {summary}
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
  return (
    <Paper component="section" variant="outlined" aria-label={title} sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, bgcolor: locked ? "brand.paper" : "#fff" }}>
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
          {title}
        </Typography>
        {action}
      </Stack>
      {locked ? (
        lockedHint ? (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, pl: 5.5 }}>
            {lockedHint}
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
  billing_address: AddressValues
  saveToAccount: boolean
}

function AddressSection({
  cart,
  customer,
  countries,
  defaultCountry,
  busy,
  onSubmit,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer
  countries: { code: string; name: string }[]
  defaultCountry: string
  busy: boolean
  onSubmit: (body: AddressBody) => Promise<boolean>
}) {
  const t = useTranslations("Checkout")
  const ta = useTranslations("Address")
  const locale = useLocale()
  const savedAddresses = useMemo(() => {
    const allowed = new Set(countries.map((country) => country.code))
    return (customer.addresses ?? []).filter((address) => address.country_code && allowed.has(address.country_code))
  }, [countries, customer.addresses])
  const defaultAddress = savedAddresses.find((address) => address.id === customer.default_shipping_address_id)
    ?? savedAddresses.find((address) => address.is_default_shipping)
  const preferredAddress = defaultAddress ?? savedAddresses[0]
  const current = cart.shipping_address?.address_1 ? cart.shipping_address : null
  const email = cart.email || customer.email
  const withProfile = (values: AddressValues): AddressValues => ({
    ...values,
    first_name: values.first_name || customer.first_name || "",
    last_name: values.last_name || customer.last_name || "",
    phone: values.phone || customer.phone || "",
    country_code: values.country_code || defaultCountry,
  })
  const blankAddress = () => withProfile({ ...EMPTY_ADDRESS })
  const errorsFor = (values: AddressValues) => validateAddress(values, (key, args) => ta(key, args), ta(getCountryRules(values.country_code).postalLabel as "postal" | "zip" | "postcode"))

  const initialId = current
    ? savedAddresses.find((address) => sameAddress(address, current))?.id ?? "new"
    : preferredAddress?.id ?? "new"
  // null follows the cart: the form shows until the cart has an address.
  const [editingState, setEditing] = useState<boolean | null>(null)
  const editing = editingState ?? !(current && cart.email)
  const [selectedId, setSelectedId] = useState(initialId)
  const [shipping, setShipping] = useState<AddressValues>(() =>
    withProfile(toAddressValues(current ?? savedAddresses.find((address) => address.id === initialId)))
  )
  const [saveToAccount, setSaveToAccount] = useState(true)
  const [billingSame, setBillingSame] = useState(!cart.billing_address?.address_1 || sameAddress(cart.billing_address, current))
  const [billing, setBilling] = useState<AddressValues>(() => withProfile(toAddressValues(cart.billing_address ?? current)))
  const [showErrors, setShowErrors] = useState(false)
  const autoApplied = useRef(false)

  const shippingErrors = errorsFor(shipping)
  const billingErrors = billingSame ? {} : errorsFor(billing)
  const valid = !Object.keys(shippingErrors).length && !Object.keys(billingErrors).length
  // A saved address only needs its form when it is missing something.
  const showForm = selectedId === "new" || Object.keys(shippingErrors).length > 0

  const bodyFor = (values: AddressValues): AddressBody => {
    const shippingAddress = normalizeAddress(values)
    return {
      email,
      shipping_address: shippingAddress,
      billing_address: billingSame ? shippingAddress : normalizeAddress(billing),
      saveToAccount: selectedId === "new" && saveToAccount,
    }
  }

  // Ship to the default address straight away; the shopper can change it in one click.
  useEffect(() => {
    if (autoApplied.current || current || !preferredAddress) return
    autoApplied.current = true
    const values = withProfile(toAddressValues(preferredAddress))
    if (!Object.keys(errorsFor(values)).length) void onSubmit(bodyFor(values))
  })

  const pick = (id: string) => {
    setSelectedId(id)
    setShowErrors(false)
    const saved = savedAddresses.find((address) => address.id === id)
    setShipping(saved ? withProfile(toAddressValues(saved)) : blankAddress())
  }

  if (!editing && current) {
    const billingAddress = cart.billing_address
    return (
      <Step
        index={1}
        title={t("shipping")}
        done
        locked={false}
        action={
          <Button size="small" color="secondary" onClick={() => setEditing(true)} disabled={busy}>
            {t("change")}
          </Button>
        }
      >
        <Box sx={{ overflowWrap: "anywhere" }}>
          {[...formatAddressLines(current).slice(0, -1), countryName(current.country_code, locale), current.phone].filter(Boolean).map((line, index) => (
            <Typography key={`${index}:${line}`} sx={{ fontWeight: index === 0 ? 600 : 400, color: index === 0 ? "text.primary" : "text.secondary" }}>
              {line}
            </Typography>
          ))}
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1.5 }}>
            {t("confirmationTo", { email: cart.email ?? email })}
          </Typography>
          {billingAddress?.address_1 && !sameAddress(billingAddress, current) ? (
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              {t("billing")}: {formatAddressLines(billingAddress).join(", ")}
            </Typography>
          ) : null}
        </Box>
      </Step>
    )
  }

  return (
    <Step index={1} title={t("shipping")} done={false} locked={false}>
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setShowErrors(true)
          if (!valid) {
            const field = Object.keys(shippingErrors).length ? `shipping-${Object.keys(shippingErrors)[0]}` : `billing-${Object.keys(billingErrors)[0]}`
            const control = event.currentTarget.querySelector<HTMLElement>(`[id="${field}"]`)
              ?? event.currentTarget.querySelector<HTMLInputElement>(`[name="${field}"]`)
            control?.focus()
            return
          }
          void onSubmit(bodyFor(shipping)).then((ok) => {
            if (ok) setEditing(null)
          })
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {t("confirmationTo", { email })}
        </Typography>
        {savedAddresses.length ? (
          <RadioGroup name="saved_address" value={selectedId} onChange={(event) => pick(event.target.value)} aria-label={t("savedAddress")} sx={{ mb: showForm ? 2.5 : 0 }}>
            <Stack spacing={1.25}>
              {savedAddresses.map((address) => (
                <Box key={address.id} component="label" sx={{ ...selectableSx(selectedId === address.id), alignItems: "flex-start" }}>
                  <Radio value={address.id} sx={{ mt: -0.25 }} />
                  <Box sx={{ flex: 1, minWidth: 0, py: 0.75 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography sx={{ fontWeight: 600 }}>{[address.first_name, address.last_name].filter(Boolean).join(" ") || address.address_name}</Typography>
                      {address.id === defaultAddress?.id ? <Chip label={t("defaultAddress")} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} /> : null}
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25, overflowWrap: "anywhere" }}>
                      {[...formatAddressLines(address).slice(1, -1), countryName(address.country_code, locale)].join(", ")}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Box component="label" sx={selectableSx(selectedId === "new")}>
                <Radio value="new" />
                <Icon name="plus" fontSize="small" sx={{ color: "secondary.main" }} />
                <Typography sx={{ fontWeight: 600 }}>{t("addAddress")}</Typography>
              </Box>
            </Stack>
          </RadioGroup>
        ) : null}

        {showForm ? (
          <>
            {selectedId !== "new" ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("completeAddress")}
              </Alert>
            ) : null}
            <AddressFields prefix="shipping" values={shipping} errors={showErrors ? shippingErrors : {}} countries={countries} onChange={setShipping} />
            {selectedId === "new" ? (
              <FormControlLabel sx={{ mt: 1 }} control={<Checkbox checked={saveToAccount} onChange={(event) => setSaveToAccount(event.target.checked)} />} label={t("save")} />
            ) : null}
          </>
        ) : null}

        <FormControlLabel sx={{ mt: 1.5, display: "flex" }} control={<Checkbox checked={billingSame} onChange={(event) => setBillingSame(event.target.checked)} />} label={t("billingSame")} />
        {!billingSame ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
              {t("billing")}
            </Typography>
            <AddressFields prefix="billing" values={billing} errors={showErrors ? billingErrors : {}} countries={countries} onChange={setBilling} />
          </Box>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" size="large" disabled={busy} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ minWidth: 220 }}>
            {t("useAddress")}
          </Button>
          {current && cart.email ? (
            <Button type="button" size="large" color="secondary" onClick={() => setEditing(null)} disabled={busy}>
              {t("cancel")}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Step>
  )
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
              const amount = Number(option.amount ?? 0)
              const description = optionType(option)?.description
              const arrival = arrivalWindow(description, locale)
              const tracked = /tracked/i.test(description ?? "")
              return (
                <Box key={option.id} component="label" sx={selectableSx(selected === option.id)}>
                  <Radio value={option.id} disabled={busy} />
                  <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                      <Typography sx={{ fontWeight: 600 }}>{name(option)}</Typography>
                      {tracked ? <Chip label={t("tracked")} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} /> : null}
                    </Stack>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {arrival ? t("arrives", { date: arrival }) : description}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {amount === 0 ? t("free") : money(amount, cart.currency_code)}
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
  onStripePay,
}: {
  cart: HttpTypes.StoreCart
  provider: string
  busy: boolean
  onRefresh: () => void
  onPlaceOrder: () => void
  onNmiToken: (token: NmiToken) => Promise<void>
  onStripePay: (confirm: () => Promise<void>) => Promise<void>
}) {
  const money = useMoney()
  const total = money(Number(cart.total ?? 0), cart.currency_code)
  const nmiSession = provider === NMI_PROVIDER_ID ? readNmiSession(cart) : null
  const stripeSecret = provider === STRIPE_PROVIDER_ID ? readStripeClientSecret(cart) : null

  return (
    <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
      {provider === NMI_PROVIDER_ID ? (
        nmiSession ? <NmiPaymentForm key={`${nmiSession.id}:${nmiCartFingerprint(cart)}`} session={nmiSession} busy={busy} onToken={onNmiToken} />
          : <Alert severity="warning" action={<Button onClick={onRefresh}>Refresh</Button>}>Your secure payment session needs refreshing.</Alert>
      ) : provider === STRIPE_PROVIDER_ID ? (
        stripeSecret ? <StripePaymentForm key={stripeSecret} clientSecret={stripeSecret} amountLabel={total} billingDetails={stripeBillingDetails(cart)} busy={busy} onPay={onStripePay} />
          : <Alert severity="warning" action={<Button onClick={onRefresh}>Refresh</Button>}>Your card payment session needs refreshing.</Alert>
      ) : (
        <Button
          variant="contained"
          size="large"
          onClick={onPlaceOrder}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockOutlinedIcon />}
          sx={{ minWidth: { xs: 0, sm: 260 }, width: { xs: "100%", sm: "auto" } }}
        >
          {busy
            ? isPaygate(provider)
              ? "Opening PayGate.to…"
              : provider === PAYPAL_PROVIDER_ID
              ? "Opening PayPal…"
              : "Placing order…"
            : `${isPaygate(provider) ? "Continue to PayGate.to" : provider === PAYPAL_PROVIDER_ID ? "Pay with PayPal" : "Place order"} · ${total}`}
        </Button>
      )}
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 2, fontSize: 13 }}>
        {provider === NMI_PROVIDER_ID
          ? "By authorizing payment and placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. Cards are captured when ready to dispatch. Bank debits must settle before dispatch."
          : provider === STRIPE_PROVIDER_ID
          ? "By paying and placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. Your card is authorized now and charged when your order is ready to ship."
          : provider === PAYGATE_CARD
          ? "By continuing you agree to our terms of sale and confirm the products are for laboratory research use only. You will leave Vetud for PayGate.to and your selected card provider's website. Your order remains unpaid until payment is verified. Provider fees and any identity checks are shown before you pay."
          : isPaygate(provider)
          ? "By continuing you agree to our terms of sale and confirm the products are for laboratory research use only. Your order is reserved while you pay on PayGate's hosted checkout. Provider fees, network minimums and any identity checks are shown there. We ship after payment is verified."
          : provider === PAYPAL_PROVIDER_ID
          ? "By continuing you agree to our terms of sale and confirm the products are for laboratory research use only. You will be taken to PayPal to pay; your order is placed once the payment is confirmed, and we ship right after."
          : provider === MAKEPAY_PROVIDER_ID
          ? "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will be taken to MakePay to complete your payment; we ship as soon as it is confirmed."
          : "By placing your order you agree to our terms of sale and confirm the products are for laboratory research use only. You will receive payment instructions by email; we ship as soon as payment is received."}
      </Typography>
    </Box>
  )
}

function OrderSummary({ cart, place, arrival }: { cart: HttpTypes.StoreCart; place: string; arrival: string | null }) {
  const t = useTranslations("Checkout")
  const count = (cart.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0)

  return (
    <>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {t("itemCount", { count })}
        </Typography>
        <ButtonLink href="/cart" size="small" color="secondary">
          {t("editCart")}
        </ButtonLink>
      </Stack>
      <Box sx={{ mb: 2 }}>
        {(cart.items ?? []).map((item) => (
          <CartLineItem key={item.id} item={item} currencyCode={cart.currency_code} readOnly />
        ))}
      </Box>
      <OrderTotals totals={cart} shippingKnown={Boolean(cart.shipping_methods?.length)} />
      <Stack spacing={1.25} sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider", color: "text.secondary" }}>
        {place ? (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
            <Icon name="truck" sx={{ fontSize: 18, mt: 0.25, color: "secondary.main" }} />
            <Typography variant="body2">
              {t("deliveringTo", { place })}
              {arrival ? <><br />{t("arrives", { date: arrival })}</> : null}
            </Typography>
          </Stack>
        ) : null}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <LockOutlinedIcon sx={{ fontSize: 18, color: "secondary.main" }} />
          <Typography variant="body2">{t("secure")}</Typography>
        </Stack>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Icon name="mail" sx={{ fontSize: 18, color: "secondary.main" }} />
          <Typography variant="body2">
            {t.rich("help", {
              email: SITE.email,
              link: (chunks) => (
                <Box component="a" href={`mailto:${SITE.email}`} sx={{ color: "secondary.main", fontWeight: 600 }}>
                  {chunks}
                </Box>
              ),
            })}
          </Typography>
        </Stack>
      </Stack>
    </>
  )
}
