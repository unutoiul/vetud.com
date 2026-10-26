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
      setFormError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setFormError("Use a password with at least 8 characters.")
      return
    }
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      setFormError("Add your first and last name to create the account.")
      return
    }
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password)
      } else {
        await signUp({ email: email.trim(), password, first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim() })
      }
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {atCheckout ? "Account required" : mode === "signin" ? "Welcome back" : "Your Vetud account"}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {atCheckout ? "Sign in to place your order." : mode === "signin" ? "Order faster next time." : "Make every order simpler."}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {atCheckout
            ? "Our products are supplied to qualified researchers and institutions, so an account is required to order. Sign in, or create an account in a minute."
            : "An account is required to place orders. It also saves your delivery details and lets you review past orders and follow shipments."}
        </Typography>
        <Stack spacing={1.5} sx={{ mt: 4 }}>
          {(atCheckout
            ? ["An account is required to order", "Research use confirmed and recorded with each order", "Order history and tracking"]
            : ["Saved shipping addresses", "One-click checkout details", "Order history and tracking"]
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
              Sign in
            </Button>
            <Button
              variant={mode === "signup" ? "contained" : "text"}
              onClick={() => { setMode("signup"); setFormError(null); clearError() }}
            >
              Create account
            </Button>
          </Stack>
          {formError || error ? <Alert severity="error" sx={{ mb: 2 }}>{formError || error}</Alert> : null}
          <Box component="form" onSubmit={submit} noValidate>
            {mode === "signup" ? (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="First name" required value={firstName} onChange={(event) => setFirstName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "given-name" } }} /></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><TextField label="Last name" required value={lastName} onChange={(event) => setLastName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "family-name" } }} /></Grid>
              </Grid>
            ) : null}
            <Stack spacing={2}>
              <TextField label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
              {mode === "signup" ? <TextField label="Phone (optional)" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} slotProps={{ htmlInput: { autoComplete: "tel" } }} /> : null}
              <TextField label="Password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} helperText={mode === "signup" ? "At least 8 characters." : undefined} slotProps={{ htmlInput: { autoComplete: mode === "signin" ? "current-password" : "new-password", minLength: 8 } }} />
            </Stack>
            <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </Box>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>
            An account is required to place an order. We use these details to support order verification, tracking and customer service.
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  )
}

function AccountDashboard({ view }: { view: "profile" | "orders" }) {
  const { customer, signOut, pending, error } = useAccount()
  if (!customer) return null
  return (
    <Stack spacing={{ xs: 3, md: 5 }}>
      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3, bgcolor: "brand.navy", color: "#fff" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Box>
            <Typography variant="eyebrow" sx={{ color: "brand.mint" }}>Your account</Typography>
            <Typography variant="h3" component="h2" sx={{ mt: 1 }}>{customer.first_name ? `Good to see you, ${customer.first_name}.` : "Your Vetud account."}</Typography>
            <Typography sx={{ color: "rgba(255,255,255,.72)", mt: 1 }}>{customer.email}</Typography>
          </Box>
          <Button variant="outlined" disabled={pending} onClick={() => void signOut().catch(() => undefined)} sx={{ color: "#fff", borderColor: "rgba(255,255,255,.45)", alignSelf: { xs: "flex-start", sm: "center" } }}>Sign out</Button>
        </Stack>
      </Paper>
      <Stack component="nav" aria-label="Your account" direction="row" sx={{ gap: 1.5, flexWrap: "wrap" }}>
        <ButtonLink href="/account" variant={view === "profile" ? "contained" : "outlined"} aria-current={view === "profile" ? "page" : undefined}>Profile & addresses</ButtonLink>
        <ButtonLink href="/account/orders" variant={view === "orders" ? "contained" : "outlined"} aria-current={view === "orders" ? "page" : undefined} startIcon={<Icon name="package" sx={{ fontSize: 18 }} />}>Orders & tracking</ButtonLink>
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
  const { customer, updateProfile, pending, error, clearError } = useAccount()
  const [values, setValues] = useState({ first_name: customer?.first_name ?? "", last_name: customer?.last_name ?? "", phone: customer?.phone ?? "", company_name: customer?.company_name ?? "" })
  const [saved, setSaved] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setSaved(false)
    try {
      await updateProfile(values)
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
          <TextField label="First name" value={values.first_name} onChange={(event) => setValues({ ...values, first_name: event.target.value })} autoComplete="given-name" />
          <TextField label="Last name" value={values.last_name} onChange={(event) => setValues({ ...values, last_name: event.target.value })} autoComplete="family-name" />
          <TextField label="Phone" type="tel" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} autoComplete="tel" />
          <TextField label="Institution or company" value={values.company_name} onChange={(event) => setValues({ ...values, company_name: event.target.value })} autoComplete="organization" />
        </Stack>
        <Button type="submit" variant="contained" disabled={pending} sx={{ mt: 2.5 }}>{pending ? "Saving…" : "Save profile"}</Button>
      </Box>
    </Paper>
  )
}

function AddressBook() {
  const { countries, countryCode } = useStore()
  const account = useAccount()
  const { customer } = account
  const [editingId, setEditingId] = useState<string | null>(null)
  const [values, setValues] = useState<AddressValues>({ ...EMPTY_ADDRESS, country_code: countryCode })
  const [addressName, setAddressName] = useState("Home")
  const [showForm, setShowForm] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const errors = validateAddress(values)
  const addressOptions = countries.map((country) => ({ code: country.code, name: country.name }))

  const openNew = () => {
    setEditingId(null)
    setAddressName("Home")
    setValues({ ...EMPTY_ADDRESS, country_code: countryCode })
    setShowErrors(false)
    setShowForm(true)
  }

  const openEdit = (address: AccountAddress) => {
    setEditingId(address.id)
    setAddressName(address.address_name ?? "Saved address")
    setValues(toAddressValues(address))
    setShowErrors(false)
    setShowForm(true)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setShowErrors(true)
    if (Object.keys(errors).length) return
    const payload = { ...values, address_name: addressName.trim() || "Saved address", is_default_shipping: !customer?.default_shipping_address_id }
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
        <Box><Typography variant="h5" component="h2">Saved addresses</Typography><Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>Checkout can fill these in for you.</Typography></Box>
        {!showForm ? <Button variant="outlined" startIcon={<Icon name="plus" sx={{ fontSize: 17 }} />} onClick={openNew}>Add address</Button> : null}
      </Stack>
      {account.error ? <Alert severity="error" sx={{ mt: 2 }}>{account.error}</Alert> : null}
      {showForm ? (
        <Box component="form" onSubmit={save} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField label="Address name" value={addressName} onChange={(event) => setAddressName(event.target.value)} helperText="For example, Home or Lab." />
            <AddressFields prefix="account-address" values={values} errors={showErrors ? errors : {}} countries={addressOptions} onChange={setValues} />
          </Stack>
          <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
            <Button type="submit" variant="contained" disabled={account.pending}>{account.pending ? "Saving…" : "Save address"}</Button>
            <Button type="button" onClick={() => setShowForm(false)}>Cancel</Button>
          </Stack>
        </Box>
      ) : customer?.addresses?.length ? (
        <Stack spacing={1.5} sx={{ mt: 3 }}>
          {customer.addresses.map((address) => (
            <Paper key={address.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700 }}>{address.address_name || "Saved address"}</Typography>
                    {customer.default_shipping_address_id === address.id ? <Chip label="Default" size="small" color="secondary" /> : null}
                  </Stack>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>{addressSummary(address)}</Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                  <Button size="small" onClick={() => openEdit(address)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => { if (window.confirm("Remove this saved address?")) void account.deleteAddress(address.id) }}>Remove</Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 3 }}>No addresses saved yet. Add one to make your next checkout nearly automatic.</Typography>
      )}
    </Paper>
  )
}

function addressSummary(address: Partial<AccountAddress>) {
  return [
    [address.first_name, address.last_name].filter(Boolean).join(" "),
    address.company,
    address.address_1,
    address.address_2,
    [address.postal_code, address.city, address.province].filter(Boolean).join(" "),
    address.country_code?.toUpperCase(),
  ].filter(Boolean).join(" · ")
}

