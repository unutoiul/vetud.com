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
export const LOGO_URL = "https://www.pep.company/brand/email/vetud-peptide-series-logo.png"
const FONT = "Manrope,'Helvetica Neue',Arial,Helvetica,sans-serif"
const NOTICE = {
  en: "VETUD explains peptide research for education. It isn't medical advice.",
  fr: "VETUD explique la recherche sur les peptides à des fins éducatives. Ce n'est pas un avis médical.",
}
/** Gmail clips messages above 102 KB. */
const MAX_BYTES = 100 * 1024

export const manifest = JSON.parse(readFileSync(path.join(ROOT, "templates.json"), "utf8"))

function layout({ lang, preheader, rows }) {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>VETUD</title>
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
${rows.trim()}
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">${NOTICE[lang]}</p>
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">VETUD &middot; <a href="${SITE_URL}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">vetud.com</a></p>
    </td></tr></table>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>
`
}

function plainText(body, lang) {
  return `${body.trim()}\n\n${"-".repeat(40)}\n\n${NOTICE[lang]}\n\nVETUD · ${SITE_URL}\n`
}

/** Every template, built and checked: { name, id, subject, html, text }. */
export function buildAll() {
  return Object.entries(manifest).map(([name, meta]) => {
    const lang = meta.lang ?? "en"
    const rows = readFileSync(path.join(ROOT, "templates", `${name}.html`), "utf8")
    const html = layout({ lang, preheader: meta.preheader, rows })
    const text = plainText(readFileSync(path.join(ROOT, "templates", `${name}.txt`), "utf8"), lang)
    const problems = []
    const used = new Set([...`${html}${text}${meta.subject}`.matchAll(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g)].map((m) => m[1]))
    for (const variable of used) if (!meta.variables.includes(variable)) problems.push(`uses {{{${variable}}}}, which the template doesn't declare`)
    // The education site never links to the shop; only the logo image comes from pep.company.
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) if (/pep\.company/i.test(href)) problems.push(`links to the shop: ${href}`)
    if (/pep\.company/i.test(text)) problems.push("the text version mentions the shop")
    for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g)) if (src !== LOGO_URL) problems.push(`image other than the logo: ${src}`)
    if (Buffer.byteLength(html) > MAX_BYTES) problems.push(`HTML is ${Buffer.byteLength(html)} bytes, over Gmail's clipping limit`)
    if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`)
    return { name, id: meta.id, subject: meta.subject, html, text }
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
