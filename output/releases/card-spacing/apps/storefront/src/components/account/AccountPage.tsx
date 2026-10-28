"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
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

export function AuthPanel({ context = "account" }: { context?: "account" | "checkout" }) {
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { countryCode } = useStore()
  const atCheckout = context === "checkout"
  const { signIn, signUp, pending, error, clearError } = useAccount()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

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
          {atCheckout ? t("required") : mode === "signin" ? t("welcome") : t("account")}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {atCheckout ? t("checkoutTitle") : mode === "signin" ? t("signinTitle") : t("signupTitle")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {atCheckout
            ? t("checkoutIntro")
            : t("intro")}
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 4 }}>
          {(atCheckout
            ? [t("required"), t("privacy"), t("orders")]
            : [t("savedAddresses"), t("profile"), t("orders")]
          ).map((item) => (
            <Stack key={item} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
              <Icon name="checkCircle" sx={{ color: "secondary.main", fontSize: 19 }} />
              <Typography variant="body2">{item}</Typography>
            </Stack>
          ))}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            <Button
              variant={mode === "signin" ? "contained" : "text"}
              onClick={() => { setMode("signin"); setFormError(null); clearError() }}
            >
              {t("signin")}
            </Button>
            <Button
              variant={mode === "signup" ? "contained" : "text"}
              onClick={() => { setMode("signup"); setFormError(null); clearError() }}
            >
              {t("signup")}
            </Button>
          </Stack>
          {formError || error ? <Alert severity="error" sx={{ mb: 2 }}>{formError || error}</Alert> : null}
          <Box component="form" onSubmit={submit} noValidate>
            {mode === "signup" ? (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("firstName")} required value={firstName} onChange={(event) => setFirstName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "given-name" } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("lastName")} required value={lastName} onChange={(event) => setLastName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "family-name" } }} /></Grid>
              </Grid>
            ) : null}
            <Stack spacing={2}>
              <TextField label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
              {mode === "signup" ? <PhoneField country={countryCode} value={phone} onChange={setPhone} /> : null}
              <TextField label={t("password")} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} helperText={mode === "signup" ? t("passwordHelp") : undefined} slotProps={{ htmlInput: { autoComplete: mode === "signin" ? "current-password" : "new-password", minLength: 8 } }} />
            </Stack>
            <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}>
              {mode === "signin" ? t("signin") : t("signup")}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
            {t("privacy")}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}

function AccountDashboard({ view }: { view: "profile" | "orders" }) {
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
            <Typography sx={{ color: "rgba(255,255,255,.72)", mt: 1 }}>{customer.email}</Typography>
          </Box>
          <Button variant="outlined" disabled={pending} onClick={() => void signOut().catch(() => undefined)} sx={{ color: "#fff", borderColor: "rgba(255,255,255,.45)", alignSelf: { xs: "flex-start", sm: "center" } }}>{t("signout")}</Button>
        </Stack>
      </Paper>
      <Stack component="nav" aria-label="Your account" direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
        <ButtonLink href="/account" variant={view === "profile" ? "contained" : "outlined"} aria-current={view === "profile" ? "page" : undefined}>{t("profile")}</ButtonLink>
        <ButtonLink href="/account/orders" variant={view === "orders" ? "contained" : "outlined"} aria-current={view === "orders" ? "page" : undefined} startIcon={<Icon name="package" sx={{ fontSize: 18 }} />}>{t("orders")}</ButtonLink>
      </Stack>
      {view === "orders" ? <>{error ? <Alert severity="error">{error}</Alert> : null}<OrderHistory key={customer.id} /></> : (
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid size={{ xs: 12, md: 5 }}><ProfileSection /></Grid>
          <Grid size={{ xs: 12, md: 7 }}><AddressBook /></Grid>
        </Grid>
      )}
    </Stack>
  )
}

function ProfileSection() {
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { countryCode } = useStore()
  const { customer, updateProfile, pending, error, clearError } = useAccount()
  const [values, setValues] = useState({ first_name: customer?.first_name ?? "", last_name: customer?.last_name ?? "", phone: customer?.phone ?? "", company_name: customer?.company_name ?? "" })
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
      <Typography variant="h5" component="h2">Profile</Typography>
      <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, mb: 2.5 }}>Keep your order contact details up to date.</Typography>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {saved ? <Alert severity="success" sx={{ mb: 2 }}>Profile saved.</Alert> : null}
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2}>
          <TextField label="Email" value={customer?.email ?? ""} disabled />
          <TextField label={ta("firstName")} value={values.first_name} onChange={(event) => setValues({ ...values, first_name: event.target.value })} autoComplete="given-name" />
          <TextField label={ta("lastName")} value={values.last_name} onChange={(event) => setValues({ ...values, last_name: event.target.value })} autoComplete="family-name" />
          <PhoneField country={countryCode} value={values.phone} onChange={phone => setValues({ ...values, phone })} error={!isValidPhone(values.phone, countryCode) ? ta("invalidPhone") : undefined} />
          <TextField label={t("institution")} value={values.company_name} onChange={(event) => setValues({ ...values, company_name: event.target.value })} autoComplete="organization" />
        </Stack>
        <Button type="submit" variant="contained" disabled={pending} sx={{ mt: 2.5 }}>{pending ? t("saving") : t("saveProfile")}</Button>
      </Box>
    </Paper>
  )
}

function AddressBook() {
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { countries, countryCode } = useStore()
  const account = useAccount()
  const { customer } = account
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<AddressValues>({ ...EMPTY_ADDRESS, country_code: countryCode })
  const [addressName, setAddressName] = useState("Home")
  const [showForm, setShowForm] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const errors = validateAddress(values, (key, args) => ta(key, args), ta(getCountryRules(values.country_code).postalLabel as "postal" | "zip" | "postcode"))
  const addressOptions = countries.map((country) => ({ code: country.code, name: country.name }))

  const openNew = () => {
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
    setEditingId(address.id)
    setAddressName(address.address_name ?? t("savedAddress"))
    setValues(toAddressValues(address))
    setShowErrors(false)
    setShowForm(true)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (Object.keys(errors).length) return
    const generatedName = customer?.addresses?.length ? values.address_1.trim() : t("primary")
    const payload = {
      ...normalizeAddress(values),
      address_name: editingId ? addressName.trim() || generatedName : generatedName,
      is_default_shipping: !customer?.default_shipping_address_id,
    }
    try {
      if (editingId) await account.updateAddress(editingId, payload)
      else await account.createAddress(payload)
      setShowForm(false)
    } catch {
      // The account provider displays the API error.
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
        <Box><Typography variant="h5" component="h2">{t("savedAddresses")}</Typography><Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{t("addressesHelp")}</Typography></Box>
        {!showForm ? <Button variant="outlined" startIcon={<Icon name="plus" sx={{ fontSize: 17 }} />} onClick={openNew}>{t("addAddress")}</Button> : null}
      </Stack>
      {account.error ? <Alert severity="error" sx={{ mt: 2 }}>{account.error}</Alert> : null}
      {showForm ? (
        <Box component="form" onSubmit={save} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <AddressFields
              prefix="account-address"
              values={values}
              errors={showErrors ? errors : {}}
              countries={addressOptions}
              onChange={setValues}
              defaults={{ first_name: customer?.first_name, last_name: customer?.last_name, phone: customer?.phone }}
            />
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
            <Button type="submit" variant="contained" disabled={account.pending}>{account.pending ? t("saving") : t("saveAddress")}</Button>
            <Button type="button" onClick={() => setShowForm(false)}>{t("cancel")}</Button>
          </Stack>
        </Box>
      ) : customer?.addresses?.length ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {customer.addresses.map((address) => (
            <Paper key={address.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{address.address_name || t("savedAddress")}</Typography>
                    {customer.default_shipping_address_id === address.id ? <Chip label={t("default")} size="small" color="secondary" /> : null}
                  </Stack>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{addressSummary(address)}</Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                  <Button size="small" onClick={() => openEdit(address)}>{t("edit")}</Button>
                  <Button size="small" color="error" onClick={() => { if (window.confirm(t("confirmRemove"))) void account.deleteAddress(address.id) }}>{t("remove")}</Button>
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

function addressSummary(address: Partial<AccountAddress>) {
  return formatAddressLines(address).join(" / ")
}
