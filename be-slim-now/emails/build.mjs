// Builds this site's Resend email templates: one shared layout (BeSlimNow logo header and footer)
// around each template's body in templates/.
// Adapted from vetud-shop/emails/build.mjs; this project owns its copy.
// Usage: node build.mjs        (checks and writes dist/<name>.html and dist/<name>.txt)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
/**
 * The BeSlimNow logo as served by this site (public/brand/email/, made by `npm run brand`): a PNG on
 * white, since mail apps don't show SVG. It must be deployed before emails can show it.
 */
export const LOGO_URL = "https://www.beslimnow.com/brand/email/beslimnow-logo.png"
const FONT = "Manrope,'Helvetica Neue',Arial,Helvetica,sans-serif"
/**
 * Every customer email ends with an unsubscribe link (owner request 2026-11-28); the site fills in
 * UNSUBSCRIBE_URL with a signed link to /unsubscribe (src/lib/email/unsubscribe.ts). Until it does
 * (or for an email sent another way), the link opens an email to us. Owner emails have no link.
 */
export const VARIABLE_FALLBACKS = { UNSUBSCRIBE_URL: "mailto:contact@vetud.com?subject=Unsubscribe" }
/** Gmail clips messages above 102 KB. */
const MAX_BYTES = 100 * 1024

export const manifest = JSON.parse(readFileSync(path.join(ROOT, "templates.json"), "utf8"))

const forCustomers = (meta) => meta.audience !== "owner"

/** The variables a template declares in Resend: its own, plus UNSUBSCRIBE_URL for customer emails. */
export const variablesOf = (meta) => [...meta.variables, ...(forCustomers(meta) ? ["UNSUBSCRIBE_URL"] : [])]

const UNSUBSCRIBE_HTML = `\n      <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">Don&#39;t want these emails? <a href="{{{UNSUBSCRIBE_URL}}}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">Unsubscribe</a></p>`

function layout({ preheader, rows, unsubscribe }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>VETUD Peptide Series</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f7fc;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f3f7fc;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f7fc" style="background-color:#f3f7fc;">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;">
  <tr><td style="padding:24px 32px 20px;border-bottom:3px solid #15265e;">
    <img src="${LOGO_URL}" width="220" height="45" alt="BeSlimNow" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:#15265e;">
  </td></tr>
${rows.trim()}
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">VETUD Peptide Series &middot; <a href="{{{SITE_URL}}}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">{{{SITE_URL}}}</a></p>${unsubscribe ? UNSUBSCRIBE_HTML : ""}
    </td></tr></table>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>
`
}

function plainText(body, unsubscribe) {
  const footer = unsubscribe ? "\n\nDon't want these emails? Unsubscribe: {{{UNSUBSCRIBE_URL}}}" : ""
  return `${body.trim()}\n\n${"-".repeat(40)}\n\nVETUD Peptide Series · {{{SITE_URL}}}${footer}\n`
}

/** Every template, built and checked: { name, id, subject, html, text }. */
export function buildAll() {
  return Object.entries(manifest).map(([name, meta]) => {
    const rows = readFileSync(path.join(ROOT, "templates", `${name}.html`), "utf8")
    const unsubscribe = forCustomers(meta)
    const html = layout({ preheader: meta.preheader, rows, unsubscribe })
    const text = plainText(readFileSync(path.join(ROOT, "templates", `${name}.txt`), "utf8"), unsubscribe)
    const variables = variablesOf(meta)
    const problems = []
    const used = new Set(
      [...`${html}${text}${meta.subject}`.matchAll(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g)].map((m) => m[1]),
    )
    for (const variable of used)
      if (!variables.includes(variable))
        problems.push(`uses {{{${variable}}}}, which the Resend template doesn't declare`)
    for (const variable of variables) if (!used.has(variable)) problems.push(`declares ${variable} but never uses it`)
    if (variables.includes("EMAIL")) problems.push("EMAIL is a reserved Resend variable name")
    if (meta.name.length > 50) problems.push("Resend template names are 50 characters at most")
    if (Buffer.byteLength(html) > MAX_BYTES)
      problems.push(`HTML is ${Buffer.byteLength(html)} bytes, over Gmail's clipping limit`)
    if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`)
    return { name, id: meta.id, subject: meta.subject, html, text, variables }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(ROOT, "dist"), { recursive: true })
  for (const email of buildAll()) {
    writeFileSync(path.join(ROOT, "dist", `${email.name}.html`), email.html)
    writeFileSync(path.join(ROOT, "dist", `${email.name}.txt`), email.text)
    console.log(`${email.name.padEnd(24)} ${(Buffer.byteLength(email.html) / 1024).toFixed(1)} KB`)
  }
}
