"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import PhoneField from "../common/PhoneField"
import { getCountryRules } from "@/i18n/config"
import { normalizeAddress, normalizePhone, isValidPhone, formatAddressLines } from "@/lib/address"
import { useAccount, type AccountAddress } from "./AccountProvider"
import Icon from "../brand/Icon"
import { useStore } from "../store/StoreProvider"
import { ButtonLink } from "../common/links"
import OrderHistory from "./OrderHistory"
import AddressFields, {
  EMPTY_ADDRESS,
  toAddressValues,
  validateAddress,
  type AddressValues,
} from "../checkout/AddressFields"
import { brand } from "@/theme/tokens"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

export default function AccountPage({ view = "profile" }: { view?: "profile" | "orders" }) {
  const { customer, loading } = useAccount()

  if (loading) return <Skeleton variant="rounded" height={480} />
  if (!customer) return <AuthPanel />
  return <AccountDashboard key={customer.id} view={view} />
}

/** The address a code was just sent to, kept for this tab: going to the mail app and back may reload it. */
const PENDING_KEY = "vetud_sign_in_email"

function readPendingEmail() {
  try {
    return window.sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

function writePendingEmail(email: string | null) {
  try {
    if (email) window.sessionStorage.setItem(PENDING_KEY, email)
    else window.sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Without storage the code step still works until the page is reloaded.
  }
}

/**
 * Sign in, or create an account, with a 6-digit code emailed to you: there are no passwords
 * (owner, 2026-11-19). A sign-in lasts 30 days. `initialEmail` fills the email field, for example
 * with what the shopper typed at checkout.
 */
export function AuthPanel({
  context = "account",
  initialEmail = "",
}: {
  context?: "account" | "checkout"
  initialEmail?: string
}) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const atCheckout = context === "checkout"
  const { requestCode, verifyCode, pending, error, clearError } = useAccount()
  const [email, setEmail] = useState(initialEmail)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [wait, setWait] = useState(0)
  const [fresh, setFresh] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  // Back from the mail app: the code step is still open (at checkout, only for the same address).
  useEffect(() => {
    const saved = readPendingEmail()
    if (!saved || (initialEmail && saved.toLowerCase() !== initialEmail.trim().toLowerCase())) return
    const timer = window.setTimeout(() => {
      setSentTo(saved)
      setEmail(saved)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialEmail])

  // Counts down to when another code can be sent.
  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const send = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setFormError(null)
    clearError()
    const address = (sentTo ?? email).trim()
    if (!EMAIL_PATTERN.test(address)) {
      setFormError(t("invalidEmail"))
      return
    }
    try {
      const { sent, resendAfter } = await requestCode(address)
      setFresh(sent)
      setSentTo(address)
      writePendingEmail(address)
      setCode("")
      setWait(resendAfter)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    clearError()
    if (!sentTo) return
    if (!/^\d{6}$/.test(code.replace(/\D/g, ""))) {
      setFormError(ct("Enter the 6-digit code from the email."))
      return
    }
    try {
      await verifyCode(sentTo, code)
      writePendingEmail(null)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  const changeEmail = () => {
    setSentTo(null)
    writePendingEmail(null)
    setCode("")
    setFormError(null)
    clearError()
  }

  const message = formError || error
  const form =
    sentTo === null ? (
      <Box component="form" onSubmit={send} noValidate>
        {message ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {ct(message)}
          </Alert>
        ) : null}
        <TextField
          label={act("email")}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          helperText={ct("No password needed. We'll email you a 6-digit code; if you're new, it creates your account.")}
          slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false, inputMode: "email" } }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={pending}
          startIcon={
            pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="mail" sx={{ fontSize: 17 }} />
          }
          sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}
        >
          {ct("Email me a sign-in code")}
        </Button>
      </Box>
    ) : (
      <Box component="form" onSubmit={verify} noValidate>
        <Alert severity="info" role="status" sx={{ mb: 2 }}>
          {ct(fresh ? "We sent a 6-digit code to" : "We sent a code a moment ago to")}{" "}
          <Box component="strong" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>
            {sentTo}
          </Box>
          .{" "}
          {ct(
            fresh
              ? "It works for 10 minutes. Check your spam folder if you can't see it."
              : "Use that one, or ask for a new code when the timer ends.",
          )}
        </Alert>
        {message ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {ct(message)}
          </Alert>
        ) : null}
        <TextField
          label={ct("Sign-in code")}
          required
          autoFocus
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
          slotProps={{
            htmlInput: {
              autoComplete: "one-time-code",
              inputMode: "numeric",
              maxLength: 7,
              sx: { letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", fontSize: 20 },
            },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={pending}
          startIcon={
            pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />
          }
          sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}
        >
          {t("signin")}
        </Button>
        <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
          <Button type="button" disabled={pending || wait > 0} onClick={() => void send()} sx={{ minHeight: 44 }}>
            {wait > 0 ? ct.template("Send a new code in {v0} s", { v0: wait }) : ct("Send a new code")}
          </Button>
          <Button type="button" onClick={changeEmail} sx={{ minHeight: 44 }}>
            {ct("Use a different email")}
          </Button>
        </Stack>
      </Box>
    )

  // At checkout and on the order confirmation the panel sits inside a narrow card that already
  // explains why to sign in, so only the form is shown.
  if (atCheckout) return <Box>{form}</Box>

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {t("account")}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {t("signinTitle")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>{t("intro")}</Typography>
        <Stack spacing={1.5} sx={{ mt: 4 }}>
          {[t("savedAddresses"), t("profile"), t("orders")].map((item) => (
            <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Icon name="checkCircle" sx={{ color: "secondary.main", fontSize: 19 }} />
              <Typography variant="body2">{ct(item)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          <Typography variant="h5" component="h3" sx={{ mb: 2.5 }}>
            {sentTo === null ? ct("Sign in or create an account") : ct("Check your email")}
          </Typography>
          {form}
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
            {t("privacy")}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}

function AccountDashboard({ view }: { view: "profile" | "orders" }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const { customer, signOut, pending, error } = useAccount()
  if (!customer) return null
  return (
    <Stack spacing={{ xs: 3, md: 5 }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, bgcolor: "brand.navy", color: brand.white }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Box>
            <Typography variant="eyebrow" sx={{ color: "brand.mint" }}>
              {t("account")}
            </Typography>
            <Typography variant="h3" component="h2" sx={{ mt: 1 }}>
              {customer.first_name ? t("greeting", { name: customer.first_name }) : t("account")}
            </Typography>
            <Typography sx={{ color: brand.whiteA72, mt: 1 }}>{ct(customer.email)}</Typography>
          </Box>
          <Button
            variant="outlined"
            disabled={pending}
            onClick={() => void signOut().catch(() => undefined)}
            sx={{ color: brand.white, borderColor: brand.whiteA45, alignSelf: { xs: "flex-start", sm: "center" } }}
          >
            {t("signout")}
          </Button>
        </Stack>
      </Paper>
      <Stack component="nav" aria-label={act("yourAccount")} direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
        <ButtonLink
          href="/account"
          variant={view === "profile" ? "contained" : "outlined"}
          aria-current={view === "profile" ? "page" : undefined}
        >
          {t("profile")}
        </ButtonLink>
        <ButtonLink
          href="/account/orders"
          variant={view === "orders" ? "contained" : "outlined"}
          aria-current={view === "orders" ? "page" : undefined}
          startIcon={<Icon name="package" sx={{ fontSize: 18 }} />}
        >
          {t("orders")}
        </ButtonLink>
      </Stack>
      {view === "orders" ? (
        <>
          {error ? <Alert severity="error">{ct(error)}</Alert> : null}
          <OrderHistory key={customer.id} />
        </>
      ) : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <ProfileSection />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AddressBook />
          </Grid>
        </Grid>
      )}
    </Stack>
  )
}

function ProfileSection() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { countryCode } = useStore()
  const { customer, updateProfile, pending, error, clearError } = useAccount()
  const [values, setValues] = useState({
    first_name: customer?.first_name ?? "",
    last_name: customer?.last_name ?? "",
    phone: customer?.phone ?? "",
    company_name: customer?.company_name ?? "",
  })
  const [saved, setSaved] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setSaved(false)
    try {
      if (!isValidPhone(values.phone, countryCode)) return
      await updateProfile({ ...values, phone: normalizePhone(values.phone, countryCode) })
      setSaved(true)
    } catch {
      // The provider displays the API error.
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, height: "100%" }}>
      <Typography variant="h5" component="h2">
        {ct("Profile")}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2.5 }}>
        {ct("Keep your order contact details up to date.")}
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {ct(error)}
        </Alert>
      ) : null}
      {saved ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {ct("Profile saved.")}
        </Alert>
      ) : null}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label={act("email")} value={customer?.email ?? ""} disabled />
          <TextField
            label={ta("firstName")}
            value={values.first_name}
            onChange={(event) => setValues({ ...values, first_name: event.target.value })}
            autoComplete="given-name"
          />
          <TextField
            label={ta("lastName")}
            value={values.last_name}
            onChange={(event) => setValues({ ...values, last_name: event.target.value })}
            autoComplete="family-name"
          />
          <PhoneField
            country={countryCode}
            value={values.phone}
            onChange={(phone) => setValues({ ...values, phone })}
            label={ta("phoneOptional")}
            error={!isValidPhone(values.phone, countryCode) ? ta("invalidPhone") : undefined}
          />
          <TextField
            label={t("institution")}
            value={values.company_name}
            onChange={(event) => setValues({ ...values, company_name: event.target.value })}
            autoComplete="organization"
          />
        </Stack>
        <Button type="submit" variant="contained" disabled={pending} sx={{ mt: 2.5 }}>
          {ct(pending ? t("saving") : t("saveProfile"))}
        </Button>
      </Box>
    </Paper>
  )
}

function AddressBook() {
  const ct = useContentTranslator()
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { deliveryCountries, countryCode } = useStore()
  const account = useAccount()
  const { customer } = account
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<AddressValues>({ ...EMPTY_ADDRESS, country_code: countryCode })
  const [addressName, setAddressName] = useState("Home")
  const [showForm, setShowForm] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [makeDefault, setMakeDefault] = useState(false)
  const [addressNotice, setAddressNotice] = useState("")
  const defaultAddressId =
    customer?.default_shipping_address_id || customer?.addresses?.find((address) => address.is_default_shipping)?.id
  const errors = validateAddress(
    values,
    (key, args) => ta(key, args),
    ta(getCountryRules(values.country_code).postalLabel as "postal" | "zip" | "postcode"),
  )
  // Saved addresses can be anywhere checkout delivers to: the whole world.
  const addressOptions = deliveryCountries.map((code) => ({ code, name: code.toUpperCase() }))

  const openNew = () => {
    account.clearError()
    setAddressNotice("")
    setMakeDefault(!defaultAddressId)
    setEditingId(null)
    setAddressName("")
    setValues({
      ...EMPTY_ADDRESS,
      country_code: countryCode,
      first_name: customer?.first_name ?? "",
      last_name: customer?.last_name ?? "",
      phone: customer?.phone ?? "",
    })
    setShowErrors(false)
    setShowForm(true)
  }

  const openEdit = (address: AccountAddress) => {
    account.clearError()
    setAddressNotice("")
    setMakeDefault(address.id === defaultAddressId)
    setEditingId(address.id)
    setAddressName(address.address_name ?? t("savedAddress"))
    setValues(toAddressValues(address))
    setShowErrors(false)
    setShowForm(true)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    // Show the form's own messages (like checkout) and take the visitor to the first one.
    const firstError = Object.keys(errors)[0]
    if (firstError) {
      event.currentTarget.querySelector<HTMLElement>(`[id="account-address-${firstError}"]`)?.focus()
      return
    }
    const generatedName = customer?.addresses?.length ? values.address_1.trim() : t("primary")
    const payload = {
      ...normalizeAddress(values),
      address_name: editingId ? addressName.trim() || generatedName : generatedName,
      ...(makeDefault || !defaultAddressId ? { is_default_shipping: true } : {}),
    }
    try {
      if (editingId) await account.updateAddress(editingId, payload)
      else await account.createAddress(payload)
      setShowForm(false)
      setAddressNotice(ct("Address saved."))
    } catch {
      // The account provider displays the API error.
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}
      >
        <Box>
          <Typography variant="h5" component="h2">
            {t("savedAddresses")}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            {ct(
              "Your default address is used automatically at checkout. You can choose another address for any order.",
            )}
          </Typography>
        </Box>
        {!showForm ? (
          <Button
            variant="outlined"
            disabled={account.pending}
            startIcon={<Icon name="plus" sx={{ fontSize: 17 }} />}
            onClick={openNew}
            sx={{ flexShrink: 0, minHeight: 44 }}
          >
            {t("addAddress")}
          </Button>
        ) : null}
      </Stack>
      {account.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {ct(account.error)}
        </Alert>
      ) : null}
      {addressNotice ? (
        <Alert severity="success" role="status" sx={{ mt: 2 }}>
          {addressNotice}
        </Alert>
      ) : null}
      {showForm ? (
        <Box component="form" onSubmit={save} noValidate sx={{ mt: 3 }}>
          <Box
            component="fieldset"
            disabled={account.pending}
            inert={account.pending}
            sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}
          >
            <Typography component="legend" sx={{ mb: 2, fontWeight: 650 }}>
              {editingId ? ct("Edit address") : t("addAddress")}
            </Typography>
            <AddressFields
              prefix="account-address"
              values={values}
              errors={showErrors ? errors : {}}
              countries={addressOptions}
              onChange={setValues}
              disabled={account.pending}
              defaults={{ first_name: customer?.first_name, last_name: customer?.last_name, phone: customer?.phone }}
            />
            {!defaultAddressId || editingId === defaultAddressId ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {ct("This will be your default address for future orders.")}
              </Typography>
            ) : (
              <FormControlLabel
                sx={{ mt: 1.5 }}
                control={<Checkbox checked={makeDefault} onChange={(event) => setMakeDefault(event.target.checked)} />}
                label={ct("Use as my default address for future orders")}
              />
            )}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
            <Button type="submit" variant="contained" disabled={account.pending}>
              {ct(account.pending ? t("saving") : t("saveAddress"))}
            </Button>
            <Button type="button" disabled={account.pending} onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
          </Stack>
        </Box>
      ) : customer?.addresses?.length ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {customer.addresses.map((address) => (
            <Paper key={address.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <Stack
                    direction="row"
                    useFlexGap
                    spacing={1}
                    sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{ct(address.address_name || t("savedAddress"))}</Typography>
                    {defaultAddressId === address.id ? (
                      <Chip label={t("default")} size="small" color="secondary" />
                    ) : null}
                  </Stack>
                  {formatAddressLines(address).map((line, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      {line}
                    </Typography>
                  ))}
                </Box>
                <Stack
                  direction="row"
                  useFlexGap
                  spacing={0.5}
                  sx={{ flexWrap: "wrap", alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}
                >
                  {defaultAddressId !== address.id ? (
                    <Button
                      size="small"
                      disabled={account.pending}
                      sx={{ minHeight: 44 }}
                      onClick={() => {
                        setAddressNotice("")
                        void account
                          .updateAddress(address.id, { is_default_shipping: true })
                          .then(() => setAddressNotice(ct("Default address updated.")))
                          .catch(() => undefined)
                      }}
                    >
                      {ct("Make default")}
                    </Button>
                  ) : null}
                  <Button
                    size="small"
                    disabled={account.pending}
                    sx={{ minHeight: 44 }}
                    onClick={() => openEdit(address)}
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={account.pending}
                    sx={{ minHeight: 44 }}
                    onClick={() => {
                      if (window.confirm(t("confirmRemove"))) {
                        setAddressNotice("")
                        void account.deleteAddress(address.id).catch(() => undefined)
                      }
                    }}
                  >
                    {t("remove")}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
          {t("noAddresses")}
        </Typography>
      )}
    </Paper>
  )
}
