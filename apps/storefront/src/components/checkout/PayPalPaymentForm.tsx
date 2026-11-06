"use client"

import { useLocale, useTranslations } from "next-intl"

import { DISPATCH_ACTION, PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Skeleton from "@mui/material/Skeleton"
import { useState } from "react"
import type { PayPalConfig } from "@/lib/paypal"

type Props = {
  config: PayPalConfig
  busy: boolean
  createOrder: () => Promise<string>
  onApprove: (orderId: string) => Promise<void>
}

// PayPal's supported locales: https://developer.paypal.com/api/codes/locale/
const PAYPAL_LOCALES: Record<string, string> = {
  en: "en_US", cs: "cs_CZ", da: "da_DK", de: "de_DE", el: "el_GR", es: "es_ES",
  fi: "fi_FI", fr: "fr_FR", hu: "hu_HU", it: "it_IT", nl: "nl_NL", nb: "no_NO",
  pl: "pl_PL", pt: "pt_PT", sv: "sv_SE",
}

export default function PayPalPaymentForm(props: Props) {
  const locale = useLocale()
  return (
    <PayPalScriptProvider options={{
      clientId: props.config.client_id,
      locale: locale === "en-GB" ? "en_GB" : PAYPAL_LOCALES[locale.split("-")[0]],
      currency: props.config.currency.toUpperCase(),
      intent: props.config.intent || "capture",
      components: "buttons",
      disableFunding: "card,credit,paylater,venmo",
      dataPartnerAttributionId: "MBJ_Medusa_SI",
    }}>
      <WalletButtons {...props} />
    </PayPalScriptProvider>
  )
}

function WalletButtons({ config, busy, createOrder, onApprove }: Props) {
  const act = useTranslations("Actions")
  const [{ isPending, isRejected, options }, dispatch] = usePayPalScriptReducer()
  const [message, setMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  return (
    <Box sx={{ maxWidth: 420 }}>
      {config.environment === "sandbox" ? <Alert severity="warning" sx={{ mb: 2 }}>PayPal sandbox — no real payment.</Alert> : null}
      {isPending ? <Skeleton variant="rounded" height={48} aria-label={act("loadingPayPal")} /> : null}
      {isRejected ? (
        <Alert severity="warning" action={<Button onClick={() => dispatch({ type: DISPATCH_ACTION.RESET_OPTIONS, value: options })}>{act("retry")}</Button>}>
          PayPal could not load. Try again or choose another payment method.
        </Alert>
      ) : null}
      <PayPalButtons
        fundingSource="paypal"
        disabled={busy || processing}
        style={{ layout: "vertical", color: config.button_color || "gold", shape: config.button_shape || "rect", label: config.button_label || "paypal", height: Math.max(25, Math.min(55, config.button_height || 48)) }}
        createOrder={async () => { setMessage(null); return createOrder() }}
        onApprove={async ({ orderID }) => {
          setProcessing(true)
          try { await onApprove(orderID) } finally { setProcessing(false) }
        }}
        onCancel={() => setMessage("PayPal checkout was cancelled. You can try again or choose another payment method.")}
        onError={() => setMessage("PayPal could not finish this checkout. Check your orders if you approved a payment, or try another payment method.")}
      />
      {processing ? <Box role="status" sx={{ mt: 1 }}>Confirming your payment…</Box> : null}
      {message ? <Alert severity="info" sx={{ mt: 2 }} role="status">{message}</Alert> : null}
    </Box>
  )
}
