// Builds the shop's Resend email templates: one shared VETUD Peptide Series layout (logo header,
// research-use footer) around each template's body in templates/. Output goes to dist/.
// Usage: node build.mjs        (checks and writes dist/<name>.html and dist/<name>.txt)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))
export const SHOP_URL = "https://www.pep.company"
/** Rendered from frontend/public/brand/vetud-logo.svg; mail apps don't show SVG. Served by the storefront. */
export const LOGO_URL = `${SHOP_URL}/brand/email/vetud-peptide-series-logo.png`
const FONT = "Manrope,'Helvetica Neue',Arial,Helvetica,sans-serif"
const RESEARCH_USE =
  "VETUD products are sold for laboratory research use only. Not for human or veterinary use. This email does not provide medical advice."
/** Gmail clips messages above 102 KB. */
const MAX_BYTES = 100 * 1024

export const manifest = JSON.parse(readFileSync(path.join(ROOT, "templates.json"), "utf8"))

function layout({ preheader, rows }) {
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
    <a href="${SHOP_URL}" style="text-decoration:none;"><img src="${LOGO_URL}" width="220" height="46" alt="VETUD Peptide Series" style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;color:#15265e;"></a>
  </td></tr>
${rows.trim()}
  <tr><td style="padding:0 32px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid #e2e8f0;padding-top:20px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">${RESEARCH_USE}</p>
      <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#67758b;">VETUD Peptide Series &middot; <a href="${SHOP_URL}" style="font-family:${FONT};color:#3268aa;text-decoration:underline;">pep.company</a></p>
    </td></tr></table>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>
`
}

function plainText(body) {
  return `${body.trim()}\n\n${"-".repeat(40)}\n\n${RESEARCH_USE}\n\nVETUD Peptide Series · ${SHOP_URL}\n`
}

/** Every template, built and checked: { name, id, subject, html, text }. */
export function buildAll() {
  return Object.entries(manifest).map(([name, meta]) => {
    const rows = readFileSync(path.join(ROOT, "templates", `${name}.html`), "utf8")
    const html = layout({ preheader: meta.preheader, rows })
    const text = plainText(readFileSync(path.join(ROOT, "templates", `${name}.txt`), "utf8"))
    const problems = []
    const used = new Set(
      [...`${html}${text}${meta.subject}`.matchAll(/\{\{\{\s*([A-Z0-9_]+)\s*\}\}\}/g)].map((m) => m[1]),
    )
    for (const variable of used)
      if (!meta.variables.includes(variable))
        problems.push(`uses {{{${variable}}}}, which the Resend template doesn't declare`)
    if (/vetud\.com/i.test(html + text)) problems.push("links to vetud.com, the education site")
    for (const [, src] of html.matchAll(/<img[^>]+src="([^"]+)"/g))
      if (!src.startsWith(`${SHOP_URL}/`)) problems.push(`image outside ${SHOP_URL}: ${src}`)
    if (Buffer.byteLength(html) > MAX_BYTES)
      problems.push(`HTML is ${Buffer.byteLength(html)} bytes, over Gmail's clipping limit`)
    if (problems.length) throw new Error(`${name}: ${problems.join("; ")}`)
    return { name, id: meta.id, subject: meta.subject, html, text }
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(path.join(ROOT, "dist"), { recursive: true })
  for (const email of buildAll()) {
    writeFileSync(path.join(ROOT, "dist", `${email.name}.html`), email.html)
    writeFileSync(path.join(ROOT, "dist", `${email.name}.txt`), email.text)
    console.log(`${email.name.padEnd(20)} ${(Buffer.byteLength(email.html) / 1024).toFixed(1)} KB`)
  }
}
