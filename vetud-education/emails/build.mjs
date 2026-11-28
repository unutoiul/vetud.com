// Builds the education site's Resend email templates: one shared layout (logo header, education
// notice footer) around each template's body in templates/. Output goes to dist/.
// The layout matches the shop's emails (vetud-shop/emails), with vetud.com links and never a link to
// the shop. The logo is the VETUD Peptide Series PNG served by pep.company (owner's choice, 2026-11-18).
// Usage: node build.mjs        (checks and writes dist/<name>.html and dist/<name>.txt)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
export const SITE_URL = "https://www.vetud.com"
const BOOK_COVER_URL = `${SITE_URL}/images/book/peptides-the-complete-guide-email.jpg`
const BOOK_TITLE = "Peptides: The Complete Guide"
export const LOGO_URL = "https://www.pep.company/brand/email/vetud-peptide-series-logo.png"
const FONT = "Manrope,'Helvetica Neue',Arial,Helvetica,sans-serif"
const NOTICE = {
  en: "VETUD explains peptide research for education. It isn't medical advice.",
  fr: "VETUD explique la recherche sur les peptides à des fins éducatives. Ce n'est pas un avis médical.",
}
const UNSUBSCRIBE = {
  en: { html: "Don&#39;t want these emails?", text: "Don't want these emails? Unsubscribe:", link: "Unsubscribe" },
  fr: {
    html: "Vous ne voulez plus de ces e-mails ?",
    text: "Vous ne voulez plus de ces e-mails ? Se désinscrire :",
    link: "Se désinscrire",
  },
}
/**
 * Every reader's email ends with an unsubscribe link (owner request 2026-11-28); the backend fills in
 * UNSUBSCRIBE_URL with a signed link for the recipient. Until it does (or for an email sent some other
 * way), the link opens an email to us instead. Emails to the owner (audience "owner") have no link.
 */
export const VARIABLE_FALLBACKS = { UNSUBSCRIBE_URL: "mailto:contact@vetud.com?subject=Unsubscribe" }
/** Gmail clips messages above 102 KB. */
const MAX_BYTES = 100 * 1024

export const manifest = JSON.parse(readFileSync(path.join(ROOT, "templates.json"), "utf8"))

const forReaders = (meta) => meta.audience !== "owner"

/** The variables a template declares in Resend: its own, plus UNSUBSCRIBE_URL for readers' emails. */
export const variablesOf = (meta) => [...meta.variables, ...(forReaders(meta) ? ["UNSUBSCRIBE_URL"] : [])]

function unsubscribeHtml(lang) {
  const words = UNSUBSCRIBE[lang]
  return `\n      <p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">${words.html} <a href="{{{UNSUBSCRIBE_URL}}}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">${words.link}</a></p>`
}

function bookSummary(link) {
  return `<tr><td bgcolor="#edf3f6" style="padding:16px 24px;background-color:#edf3f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td width="72" valign="middle"><a href="${link.href}"><img src="${BOOK_COVER_URL}" width="72" height="96" alt="${link.label}" style="display:block;border:0;border-radius:3px;color:#15265e;font:13px Arial,sans-serif;"></a></td>
      <td valign="middle" style="padding-left:16px;">
        <p style="margin:0 0 4px;font-family:${FONT};color:#386d86;font-size:13px;line-height:18px;">PDF edition</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;color:#15265e;font-size:23px;line-height:28px;">${BOOK_TITLE}</p>
      </td>
    </tr></table>
  </td></tr>`
}

function layout({ lang, preheader, rows, unsubscribe, bookLink }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${bookLink ? BOOK_TITLE + " · VETUD" : "VETUD"}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f7fc;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;font-size:1px;line-height:1px;color:#f3f7fc;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f7fc" style="background-color:#f3f7fc;">
<tr><td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;">
  <tr><td style="padding:24px 32px 20px;border-bottom:3px solid #15265e;">
    <a href="${SITE_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="220" height="46" alt="VETUD Peptide Series" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:#15265e;"></a>
  </td></tr>
${bookLink ? bookSummary(bookLink) + "\n" : ""}${rows.trim()}
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">${NOTICE[lang]}</p>
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">VETUD &middot; <a href="${SITE_URL}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">vetud.com</a></p>${unsubscribe ? unsubscribeHtml(lang) : ""}
    </td></tr></table>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>
`
}

function plainText(body, lang, unsubscribe) {
  const footer = unsubscribe ? `\n\n${UNSUBSCRIBE[lang].text} {{{UNSUBSCRIBE_URL}}}` : ""
  return `${body.trim()}\n\n${"-".repeat(40)}\n\n${NOTICE[lang]}\n\nVETUD · ${SITE_URL}${footer}\n`
}

/** Every template, built and checked: { name, id, subject, html, text }. */
export function buildAll() {
  return Object.entries(manifest).map(([name, meta]) => {
    const lang = meta.lang ?? "en"
    const rows = readFileSync(path.join(ROOT, "templates", `${name}.html`), "utf8")
    const unsubscribe = forReaders(meta)
    const html = layout({ lang, preheader: meta.preheader, rows, unsubscribe, bookLink: meta.bookLink })
    const text = plainText(readFileSync(path.join(ROOT, "templates", `${name}.txt`), "utf8"), lang, unsubscribe)
    const variables = variablesOf(meta)
    const problems = []
    const used = new Set(
      [...`${html}${text}${meta.subject}`.matchAll(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g)].map((m) => m[1]),
    )
    for (const variable of used)
      if (!variables.includes(variable)) problems.push(`uses {{{${variable}}}}, which the template doesn't declare`)
    for (const variable of variables) if (!used.has(variable)) problems.push(`declares ${variable} but never uses it`)
    if (meta.name.length > 50) problems.push("Resend template names are 50 characters at most")
    // The education site never links to the shop; only the logo image comes from pep.company.
    for (const [, href] of html.matchAll(/href="([^"]+)"/g))
      if (/pep\.company/i.test(href)) problems.push(`links to the shop: ${href}`)
    if (/pep\.company/i.test(text)) problems.push("the text version mentions the shop")
    for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g))
      if (src !== LOGO_URL && !(meta.bookLink && src === BOOK_COVER_URL))
        problems.push(`Unexpected template image: ${src}`)
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
