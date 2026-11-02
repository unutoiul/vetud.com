"use client"

import { useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useTheme } from "@mui/material/styles"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Typography from "@mui/material/Typography"
import { LockIcon } from "@/components/brand/Icon"
import { getStripe, stripeSandbox } from "@/lib/stripe"

type Props = {
  clientSecret: string
  amountLabel: string
  busy: boolean
  /** Runs the checkout; `confirm` charges the card and throws if Stripe declines it. */
  onPay: (confirm: () => Promise<void>) => Promise<void>
}

export default function StripePaymentForm(props: Props) {
  const theme = useTheme()
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: theme.palette.secondary.main,
            colorText: theme.palette.text.primary,
            borderRadius: "8px",
          },
        },
      }}
    >
      <CardForm {...props} />
    </Elements>
  )
}

function CardForm({ amountLabel, busy, onPay }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [fieldError, setFieldError] = useState<string | null>(null)

  const submit = async () => {
    if (!stripe || !elements) return
    setFieldError(null)
    // Validates the card fields before anything is sent to Medusa.
    const { error } = await elements.submit()
    if (error) {
      setFieldError(error.message ?? "Check your card details.")
      return
    }
    await onPay(async () => {
      const result = await stripe.confirmPayment({
        elements,
        // Cards only: 3-D Secure opens in a modal, so the shopper stays on this page.
        redirect: "if_required",
        confirmParams: { return_url: window.location.href },
      })
      if (result.error) throw new Error(result.error.message ?? "Your card was declined.")
      const status = result.paymentIntent?.status
      if (status !== "requires_capture" && status !== "succeeded") {
        throw new Error("Your card payment was not completed. Please try again.")
      }
    })
  }

  return (
    <Box
      component="form"
      sx={{ mt: 3 }}
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Card details
      </Typography>
      {stripeSandbox ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Stripe sandbox: no real charge. Use test card 4242 4242 4242 4242, any future expiry and any CVC.
        </Alert>
      ) : null}
      <PaymentElement options={{ layout: "tabs" }} />
      {fieldError ? (
        <Typography role="alert" variant="body2" sx={{ color: "error.main", mt: 1.5 }}>
          {fieldError}
        </Typography>
      ) : null}
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={busy || !stripe || !elements}
        startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockIcon />}
        sx={{ mt: 3, minWidth: { xs: 0, sm: 260 }, width: { xs: "100%", sm: "auto" } }}
      >
        {busy ? "Processing payment…" : `Pay ${amountLabel}`}
      </Button>
    </Box>
  )
}
