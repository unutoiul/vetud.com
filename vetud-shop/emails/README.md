# Shop email templates

The shop's customer and owner emails are published templates in Resend (Dashboard → Templates). This folder is their source. Every email shares one layout in `build.mjs`:

- the VETUD Peptide Series logo (`frontend/public/brand/email/vetud-peptide-series-logo.png`, served at `https://www.pep.company/brand/email/…`), linking to pep.company
- a white 600px card on pale blue `#f3f7fc`, with a navy `#15265e` rule under the logo
- Manrope with web-safe fallbacks, sentence-case navy buttons with 4px corners
- the research-use notice and a pep.company link at the bottom

`templates/<name>.html` holds each email's body rows and `templates/<name>.txt` its plain-text version. `templates.json` has each template's Resend ID, subject, preview text and variables. The backend only fills in the variables (`backend/src/modules/resend/templates.ts`, IDs in `template-ids.ts`). The two owner alerts (new guest checkout, newsletter sign-up) aren't Resend templates: `backend/src/modules/resend/owner-alerts.ts` builds them with the same layout.

```bash
node build.mjs     # checks every template and writes dist/
node publish.mjs   # uploads, publishes and reads back each template (or name some: node publish.mjs password-reset)
```

`build.mjs` refuses a variable the Resend template doesn't declare, any link to vetud.com, images from outside pep.company, and HTML over Gmail's 102 KB clipping limit. `publish.mjs` needs `RESEND_API_KEY` in `backend/.env`. It refuses to run until the logo is live on the storefront, so deploy the storefront first. A template change goes live as soon as it's published; no backend deployment is needed.

The education backend (vetud.com) still sends four of these templates: `contact-message`, `password-reset`, `customer-welcome` and `user-invite`. Until it has its own, those emails carry the shop's branding.
