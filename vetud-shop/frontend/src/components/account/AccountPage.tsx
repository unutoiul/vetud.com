"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import CircularProgress from "@mui/material/CircularProgress"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useTranslations } from "next-intl"
import PhoneField from "../common/PhoneField"
import { getCountryRules } from "@/i18n/config"
import { normalizeAddress, normalizePhone, isValidPhone, formatAddressLines } from "@/lib/address"
import { useAccount, type AccountAddress } from "./AccountProvider"
import Icon from "../brand/Icon"
import { useStore } from "../store/StoreProvider"
import { ButtonLink } from "../common/links"
import OrderHistory from "./OrderHistory"
import AddressFields, { EMPTY_ADDRESS, toAddressValues, validateAddress, type AddressValues } from "../checkout/AddressFields"

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

export function PasswordField({ label, value, onChange, autoComplete, helperText, error }: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  helperText?: string
  error?: boolean
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Account")
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      label={ct(label)}
      type={visible ? "text" : "password"}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helperText={ct(helperText)}
      error={error}
      slotProps={{
        htmlInput: { autoComplete, minLength: 8, spellCheck: false, autoCapitalize: "none" },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={t("showPassword")} aria-pressed={visible} onClick={() => setVisible(!visible)} edge="end">
                <Icon name={visible ? "eyeOff" : "eye"} sx={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

/** Emails a one-time reset link. Medusa replies the same way whether or not the account exists. */
export function ResetRequestForm({ initialEmail = "", onBack }: { initialEmail?: string; onBack?: () => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const { countryCode } = useStore()
  const { requestPasswordReset, pending } = useAccount()
  const [email, setEmail] = useState(initialEmail)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFormError(t("invalidEmail"))
      return
    }
    try {
      await requestPasswordReset(trimmed, countryCode)
      setSentTo(trimmed)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      {sentTo ? <Alert severity="success" role="status" sx={{ mb: 2 }}>{t("resetSent", { email: sentTo })}</Alert> : null}
      {formError ? <Alert severity="error" sx={{ mb: 2 }}>{ct(formError)}</Alert> : null}
      <TextField label={act("email")} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: { sm: "center" } }}>
        <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="mail" sx={{ fontSize: 17 }} />}>
          {ct(sentTo ? t("resendLink") : t("sendLink"))}
        </Button>
        {onBack ? <Button type="button" onClick={onBack}>{t("backToSignin")}</Button> : null}
      </Stack>
    </Box>
  )
}

export function AuthPanel({ context = "account" }: { context?: "account" | "checkout" }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { countryCode } = useStore()
  const atCheckout = context === "checkout"
  const { signIn, signUp, pending, error, clearError } = useAccount()
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const switchMode = (next: typeof mode) => {
    setMode(next)
    setFormError(null)
    clearError()
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    clearError()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFormError(t("invalidEmail"))
      return
    }
    if (password.length < 8) {
      setFormError(t("invalidPassword"))
      return
    }
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      setFormError(t("invalidName"))
      return
    }
    if (mode === "signup" && !isValidPhone(phone, countryCode)) { setFormError(ta("invalidPhone")); return }
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password)
      } else {
        await signUp({ email: email.trim(), password, first_name: firstName.trim(), last_name: lastName.trim(), phone: normalizePhone(phone, countryCode) })
      }
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {ct(atCheckout ? t("required") : mode === "signin" ? t("welcome") : t("account"))}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {ct(mode === "reset" ? t("resetTitle") : atCheckout ? t("checkoutTitle") : mode === "signin" ? t("signinTitle") : t("signupTitle"))}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {ct(mode === "reset"
            ? t("resetIntro")
            : atCheckout
            ? t("checkoutIntro")
            : t("intro"))}
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 4 }}>
          {(atCheckout
            ? [t("required"), t("privacy"), t("orders")]
            : [t("savedAddresses"), t("profile"), t("orders")]
          ).map((item) => (
            <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Icon name="checkCircle" sx={{ color: "secondary.main", fontSize: 19 }} />
              <Typography variant="body2">{ct(item)}</Typography>
            </Stack>
          ))}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          {mode === "reset" ? <ResetRequestForm initialEmail={email} onBack={() => switchMode("signin")} /> : <>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Button
              variant={mode === "signin" ? "contained" : "text"}
              aria-pressed={mode === "signin"}
              onClick={() => switchMode("signin")}
            >
              {t("signin")}
            </Button>
            <Button
              variant={mode === "signup" ? "contained" : "text"}
              aria-pressed={mode === "signup"}
              onClick={() => switchMode("signup")}
            >
              {t("signup")}
            </Button>
          </Stack>
          {formError || error ? <Alert severity="error" sx={{ mb: 2 }}>{ct(formError || error)}</Alert> : null}
          <Box component="form" onSubmit={submit} noValidate>
            {mode === "signup" ? (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("firstName")} required value={firstName} onChange={(event) => setFirstName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "given-name" } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("lastName")} required value={lastName} onChange={(event) => setLastName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "family-name" } }} /></Grid>
              </Grid>
            ) : null}
            <Stack spacing={2}>
              <TextField label={act("email")} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
              {mode === "signup" ? <PhoneField country={countryCode} value={phone} onChange={setPhone} /> : null}
              <PasswordField label={t("password")} value={password} onChange={setPassword} helperText={ct(mode === "signup" ? t("passwordHelp") : undefined)} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
              <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ width: { xs: "100%", sm: "auto" } }}>
                {ct(mode === "signin" ? t("signin") : t("signup"))}
              </Button>
              {mode === "signin" ? <Button type="button" onClick={() => switchMode("reset")} sx={{ alignSelf: { xs: "center", sm: "auto" } }}>{t("forgot")}</Button> : null}
            </Stack>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
            {t("privacy")}
          </Typography>
          </>}
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
      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, bgcolor: "brand.navy", color: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Box>
            <Typography variant="eyebrow" sx={{ color: "brand.mint" }}>{t("account")}</Typography>
            <Typography variant="h3" component="h2" sx={{ mt: 1 }}>{customer.first_name ? t("greeting", { name: customer.first_name }) : t("account")}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,.72)", mt: 1 }}>{ct(customer.email)}</Typography>
          </Box>
          <Button variant="outlined" disabled={pending} onClick={() => void signOut().catch(() => undefined)} sx={{ color: "#fff", borderColor: "rgba(255,255,255,.45)", alignSelf: { xs: "flex-start", sm: "center" } }}>{t("signout")}</Button>
        </Stack>
      </Paper>
      <Stack component="nav" aria-label={act("yourAccount")} direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
        <ButtonLink href="/account" variant={view === "profile" ? "contained" : "outlined"} aria-current={view === "profile" ? "page" : undefined}>{t("profile")}</ButtonLink>
        <ButtonLink href="/account/orders" variant={view === "orders" ? "contained" : "outlined"} aria-current={view === "orders" ? "page" : undefined} startIcon={<Icon name="package" sx={{ fontSize: 18 }} />}>{t("orders")}</ButtonLink>
      </Stack>
      {view === "orders" ? <>{error ? <Alert severity="error">{ct(error)}</Alert> : null}<OrderHistory key={customer.id} /></> : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}><ProfileSection /></Grid>
          <Grid size={{ xs: 12, md: 7 }}><AddressBook /></Grid>
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
  const { customer, updateProfile, requestPasswordReset, pending, error, clearError } = useAccount()
  const [values, setValues] = useState({ first_name: customer?.first_name ?? "", last_name: customer?.last_name ?? "", phone: customer?.phone ?? "", company_name: customer?.company_name ?? "" })
  const [saved, setSaved] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const sendReset = async () => {
    if (!customer?.email) return
    clearError()
    setResetSent(false)
    try {
      await requestPasswordReset(customer.email, countryCode)
      setResetSent(true)
    } catch {
      // The provider displays the API error.
    }
  }

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
      <Typography variant="h5" component="h2">{ct("Profile")}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2.5 }}>{ct("Keep your order contact details up to date.")}</Typography>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{ct(error)}</Alert> : null}
      {saved ? <Alert severity="success" sx={{ mb: 2 }}>{ct("Profile saved.")}</Alert> : null}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label={act("email")} value={customer?.email ?? ""} disabled />
          <TextField label={ta("firstName")} value={values.first_name} onChange={(event) => setValues({ ...values, first_name: event.target.value })} autoComplete="given-name" />
          <TextField label={ta("lastName")} value={values.last_name} onChange={(event) => setValues({ ...values, last_name: event.target.value })} autoComplete="family-name" />
          <PhoneField country={countryCode} value={values.phone} onChange={phone => setValues({ ...values, phone })} error={!isValidPhone(values.phone, countryCode) ? ta("invalidPhone") : undefined} />
          <TextField label={t("institution")} value={values.company_name} onChange={(event) => setValues({ ...values, company_name: event.target.value })} autoComplete="organization" />
        </Stack>
        <Button type="submit" variant="contained" disabled={pending} sx={{ mt: 2.5 }}>{ct(pending ? t("saving") : t("saveProfile"))}</Button>
      </Box>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6" component="h3">{t("password")}</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2 }}>{t("changePasswordHelp")}</Typography>
      {resetSent ? <Alert severity="success" role="status" sx={{ mb: 2 }}>{t("resetSentAccount", { email: customer?.email ?? "" })}</Alert> : null}
      <Button variant="outlined" disabled={pending} onClick={() => void sendReset()} startIcon={<Icon name="mail" sx={{ fontSize: 17 }} />}>{t("changePassword")}</Button>
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
  const defaultAddressId = customer?.default_shipping_address_id || customer?.addresses?.find(address => address.is_default_shipping)?.id
  const errors = validateAddress(values, (key, args) => ta(key, args), ta(getCountryRules(values.country_code).postalLabel as "postal" | "zip" | "postcode"))
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
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box><Typography variant="h5" component="h2">{t("savedAddresses")}</Typography><Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{ct("Your default address is used automatically at checkout. You can choose another address for any order.")}</Typography></Box>
        {!showForm ? <Button variant="outlined" disabled={account.pending} startIcon={<Icon name="plus" sx={{ fontSize: 17 }} />} onClick={openNew} sx={{ flexShrink: 0, minHeight: 44 }}>{t("addAddress")}</Button> : null}
      </Stack>
      {account.error ? <Alert severity="error" sx={{ mt: 2 }}>{ct(account.error)}</Alert> : null}
      {addressNotice ? <Alert severity="success" role="status" sx={{ mt: 2 }}>{addressNotice}</Alert> : null}
      {showForm ? (
        <Box component="form" onSubmit={save} noValidate sx={{ mt: 3 }}>
          <Box component="fieldset" disabled={account.pending} inert={account.pending} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" sx={{ mb: 2, fontWeight: 650 }}>{editingId ? ct("Edit address") : t("addAddress")}</Typography>
            <AddressFields
              prefix="account-address"
              values={values}
              errors={showErrors ? errors : {}}
              countries={addressOptions}
              onChange={setValues}
              disabled={account.pending}
              defaults={{ first_name: customer?.first_name, last_name: customer?.last_name, phone: customer?.phone }}
            />
            {!defaultAddressId || editingId === defaultAddressId ? <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{ct("This will be your default address for future orders.")}</Typography> : <FormControlLabel sx={{ mt: 1.5 }} control={<Checkbox checked={makeDefault} onChange={event => setMakeDefault(event.target.checked)} />} label={ct("Use as my default address for future orders")} />}
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
            <Button type="submit" variant="contained" disabled={account.pending}>{ct(account.pending ? t("saving") : t("saveAddress"))}</Button>
            <Button type="button" disabled={account.pending} onClick={() => setShowForm(false)}>{t("cancel")}</Button>
          </Stack>
        </Box>
      ) : customer?.addresses?.length ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {customer.addresses.map((address) => (
            <Paper key={address.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                  <Stack direction="row" useFlexGap spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{ct(address.address_name || t("savedAddress"))}</Typography>
                    {defaultAddressId === address.id ? <Chip label={t("default")} size="small" color="secondary" /> : null}
                  </Stack>
                  {formatAddressLines(address).map((line, index) => <Typography key={index} variant="body2" color="text.secondary">{line}</Typography>)}
                </Box>
                <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: "wrap", alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}>
                  {defaultAddressId !== address.id ? <Button size="small" disabled={account.pending} sx={{ minHeight: 44 }} onClick={() => {
                    setAddressNotice("")
                    void account.updateAddress(address.id, { is_default_shipping: true }).then(() => setAddressNotice(ct("Default address updated."))).catch(() => undefined)
                  }}>{ct("Make default")}</Button> : null}
                  <Button size="small" disabled={account.pending} sx={{ minHeight: 44 }} onClick={() => openEdit(address)}>{t("edit")}</Button>
                  <Button size="small" color="error" disabled={account.pending} sx={{ minHeight: 44 }} onClick={() => {
                    if (window.confirm(t("confirmRemove"))) {
                      setAddressNotice("")
                      void account.deleteAddress(address.id).catch(() => undefined)
                    }
                  }}>{t("remove")}</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>{t("noAddresses")}</Typography>
      )}
    </Paper>
  )
}
