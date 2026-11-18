import { formatCurrency } from "../../lib/currencies"

/**
 * Short alerts for the shop owner (STORE_OWNER_EMAIL), written here in full rather than as Resend
 * templates: a heading, a few labelled lines and a link to Medusa Admin. Owner request 2026-11-18.
 */

// The same layout as the customer emails (vetud-shop/emails): Peptide Series logo, navy rule, footer.
const NAVY = "#15265e"
const INK = "#192b4a"
const MUTED = "#67758b"
const LINE = "#e2e8f0"
const PAPER = "#f3f7fc"
const FONT = "Manrope,'Helvetica Neue',Arial,Helvetica,sans-serif"
const SHOP_URL = "https://www.pep.company"
const LOGO_URL = `${SHOP_URL}/brand/email/vetud-peptide-series-logo.png`

type OwnerAlert = {
  subject: string
  preheader: string
  heading: string
  intro: string
  /** Label and value. Values are plain text; a line break starts a new line. */
  rows: [string, string][]
  action: { label: string; url: string }
  note: string
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

const multiline = (value: string) => escape(value).split("\n").join("<br>")

function ownerAlertEmail(alert: OwnerAlert) {
  const rows = alert.rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<tr>
<td valign="top" style="padding:10px 16px 10px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:13px;line-height:1.5;color:${MUTED};white-space:nowrap;">${escape(label)}</td>
<td valign="top" style="padding:10px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;line-height:1.5;color:${INK};">${multiline(value)}</td>
</tr>`)
    .join("\n")
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escape(alert.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:${PAPER};">${escape(alert.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="background-color:${PAPER};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border:1px solid ${LINE};">
  <tr><td style="padding:24px 32px 20px;border-bottom:3px solid ${NAVY};">
    <a href="${SHOP_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="220" height="46" alt="VETUD Peptide Series" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:${NAVY};"></a>
  </td></tr>
  <tr><td style="padding:32px;font-family:${FONT};color:${INK};">
    <p style="margin:0 0 8px;font-family:'DM Mono','SFMono-Regular',Menlo,monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3268aa;">Shop alert</p>
    <h1 style="margin:0 0 12px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:600;color:${INK};">${escape(alert.heading)}</h1>
    <p style="margin:0 0 20px;font-family:${FONT};font-size:15px;line-height:1.65;color:${INK};">${escape(alert.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-bottom:1px solid ${LINE};">
${rows}
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;"><tr><td bgcolor="${NAVY}" style="background-color:${NAVY};border-radius:4px;mso-padding-alt:12px 20px;">
      <a href="${escape(alert.action.url)}" style="display:inline-block;padding:12px 20px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;">${escape(alert.action.label)}</a>
    </td></tr></table>
    <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};">${escape(alert.note)}</p>
  </td></tr>
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${LINE};padding-top:20px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">Sent to the shop owner's address (STORE_OWNER_EMAIL). Customers don't receive this email.</p>
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};">VETUD Peptide Series &middot; <a href="${SHOP_URL}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">pep.company</a></p>
    </td></tr></table>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
  const width = Math.max(...alert.rows.map(([label]) => label.length))
  const text = [
    alert.heading,
    "",
    alert.intro,
    "",
    ...alert.rows
      .filter(([, value]) => value)
      .map(([label, value]) => `${`${label}:`.padEnd(width + 2)}${value.split("\n").join(`\n${" ".repeat(width + 2)}`)}`),
    "",
    `${alert.action.label}: ${alert.action.url}`,
    "",
    alert.note,
  ].join("\n")
  return { subject: alert.subject, html, text }
}

function dateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

function countryName(code?: string | null) {
  if (!code) return ""
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase())
    return name && name !== code.toUpperCase() ? `${name} (${code.toUpperCase()})` : code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

export type NewsletterSignupAlertData = {
  email: string
  country_code?: string | null
  has_account: boolean
  offer_code?: string | null
  subscribed_at: string
  customer_url: string
}

/** Someone ticked the consent box in the shop's sign-up pop-up. */
export function newsletterSignupAlert(data: NewsletterSignupAlertData) {
  return ownerAlertEmail({
    subject: `New newsletter sign-up: ${data.email}`,
    preheader: `${data.email} signed up for VETUD offers and news.`,
    heading: "New newsletter sign-up",
    intro: "Someone signed up in the shop's pop-up and agreed to receive VETUD offers and news by email.",
    rows: [
      ["Email", data.email],
      ["Country", countryName(data.country_code)],
      ["Shop account", data.has_account ? "Yes" : "No"],
      ["Offer code sent", data.offer_code || "None (no pop-up offer is running)"],
      ["Signed up", dateTime(data.subscribed_at)],
    ],
    action: { label: "Open the customer in Medusa Admin", url: data.customer_url },
    note: "They're in the Newsletter customer group in Medusa Admin, with the wording they agreed to saved on their profile.",
  })
}

export type GuestCheckoutAlertData = {
  email: string
  currency_code: string
  items: { title: string; quantity: number; unit_price: number }[]
  region?: string | null
  account_exists: boolean
  started_at: string
  unfinished_url: string
}

/** A shopper who isn't signed in gave their email at the first checkout step. */
export function guestCheckoutAlert(data: GuestCheckoutAlertData) {
  const value = data.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = formatCurrency(value, data.currency_code)
  return ownerAlertEmail({
    subject: `Guest checkout started: ${data.email} (${total})`,
    preheader: `${data.email} started checkout without an account, with ${total} in the cart.`,
    heading: "A guest started checkout",
    intro: "Someone entered their email at checkout without signing in. If they place the order, you'll also get the usual new-order email.",
    rows: [
      ["Email", data.email],
      ["Cart", data.items.map((item) => `${item.title} × ${item.quantity} · ${formatCurrency(item.unit_price * item.quantity, data.currency_code)}`).join("\n")],
      ["Cart value", `${total} before shipping and discounts`],
      ["Region", data.region ?? ""],
      ["Shop account", data.account_exists ? "This email has an account, but they aren't signed in" : "No account"],
      ["Started", dateTime(data.started_at)],
    ],
    action: { label: "See unfinished checkouts", url: data.unfinished_url },
    note: "If they don't finish, the cart stays under Unfinished checkouts in Medusa Admin, with the step they reached. You get this email once per cart and email address.",
  })
}
