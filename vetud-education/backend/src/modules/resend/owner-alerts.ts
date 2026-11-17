/**
 * Short alerts for the site owner (STORE_OWNER_EMAIL), written here in full rather than as Resend
 * templates: a heading and a few labelled lines. Owner request 2026-11-18.
 */

const NAVY = "#15265E"
const MUTED = "#55617A"
const LINE = "#E1E7EF"
const PAPER = "#F3F6FA"

type OwnerAlert = {
  subject: string
  preheader: string
  heading: string
  intro: string
  /** Label and value. Values are plain text; a line break starts a new line. */
  rows: [string, string][]
  note: string
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

const multiline = (value: string) => escape(value).split("\n").join("<br>")

function ownerAlertEmail(alert: OwnerAlert) {
  const shown = alert.rows.filter(([, value]) => value)
  const rows = shown
    .map(([label, value]) => `<tr>
<td valign="top" style="padding:10px 16px 10px 0;border-top:1px solid ${LINE};font-size:13px;line-height:1.5;color:${MUTED};white-space:nowrap;">${escape(label)}</td>
<td valign="top" style="padding:10px 0;border-top:1px solid ${LINE};font-size:14px;line-height:1.5;color:${NAVY};">${multiline(value)}</td>
</tr>`)
    .join("\n")
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(alert.subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;">${escape(alert.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${PAPER};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid ${LINE};border-radius:12px;">
<tr><td style="padding:28px 32px 0;font-family:Helvetica,Arial,sans-serif;">
<div style="font-size:22px;letter-spacing:6px;color:${NAVY};">VETUD</div>
<div style="font-size:10px;letter-spacing:3px;color:${MUTED};text-transform:uppercase;margin-top:2px;">Site alert</div>
</td></tr>
<tr><td style="padding:24px 32px 8px;font-family:Helvetica,Arial,sans-serif;color:${NAVY};">
<h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;font-weight:600;">${escape(alert.heading)}</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${MUTED};">${escape(alert.intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-bottom:1px solid ${LINE};">
${rows}
</table>
<p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:${MUTED};">${escape(alert.note)}</p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTED};">Sent to the site owner's address (STORE_OWNER_EMAIL). Readers don't receive this email.</td></tr>
</table>
</td></tr>
</table>
</body></html>`
  const width = Math.max(...shown.map(([label]) => label.length))
  const text = [
    alert.heading,
    "",
    alert.intro,
    "",
    ...shown.map(([label, value]) => `${`${label}:`.padEnd(width + 2)}${value}`),
    "",
    alert.note,
  ].join("\n")
  return { subject: alert.subject, html, text }
}

function dateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

const LANGUAGES: Record<string, string> = { en: "English", fr: "French" }

export type EmailListSignupAlertData = {
  email: string
  locale: string
  consented_at: string
  confirmed_at: string
  is_member: boolean
  confirmed_count: number
}

/** Someone confirmed their email-list sign-up from the link we emailed them. */
export function emailListSignupAlert(data: EmailListSignupAlertData) {
  return ownerAlertEmail({
    subject: `New email-list subscriber: ${data.email}`,
    preheader: `${data.email} confirmed their sign-up on vetud.com.`,
    heading: "New email-list subscriber",
    intro: "Someone signed up on vetud.com and confirmed from the email we sent them. They'll receive new guides and answered community questions.",
    rows: [
      ["Email", data.email],
      ["Language", LANGUAGES[data.locale] ?? data.locale],
      ["Community account", data.is_member ? "Yes" : "No"],
      ["Signed up", dateTime(data.consented_at)],
      ["Confirmed", dateTime(data.confirmed_at)],
      ["Confirmed subscribers", String(data.confirmed_count)],
    ],
    note: "Only confirmed sign-ups are announced here, so addresses typed by mistake or by bots never reach you. The list is kept in the email_subscriber table of the education database.",
  })
}
