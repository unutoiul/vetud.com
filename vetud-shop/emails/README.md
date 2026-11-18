# Shop email templates

Every shop email is a published template in Resend (Dashboard → Templates), customer emails and owner alerts alike. This folder is their source. They share one layout in `build.mjs`:

- the VETUD Peptide Series logo (`frontend/public/brand/email/vetud-peptide-series-logo.png`, served at `https://www.pep.company/brand/email/…`), linking to pep.company
- a white 600px card on pale blue `#f3f7fc`, with a navy `#15265e` rule under the logo
- Manrope with web-safe fallbacks, sentence-case navy buttons with 4px corners
- the research-use notice and a pep.company link at the bottom

`templates/<name>.html` holds each email's body rows and `templates/<name>.txt` its plain-text version. `templates.json` has each template's Resend ID, name, subject, preview text and variables. The backend only fills in the variables (`backend/src/modules/resend/templates.ts`) and sends the template by its ID (`template-ids.ts`).

```bash
node build.mjs     # checks every template and writes dist/
node publish.mjs   # creates or updates, publishes and reads back each template, then rewrites template-ids.ts
node publish.mjs password-reset   # only the templates named
```

To add an email: write `templates/<name>.html` and `.txt`, add an entry to `templates.json` with `"id": null`, a `name` of 50 characters at most and its `variables`, and run `publish.mjs`. It creates the template and records its ID. Resend reserves some variable names, such as `EMAIL`.

`build.mjs` refuses a variable the template doesn't declare, any link to vetud.com, images from outside pep.company, and HTML over Gmail's 102 KB clipping limit. `publish.mjs` needs `RESEND_API_KEY` (in the environment or `backend/.env`) and refuses to run until the logo is live on the storefront. An edited template goes live as soon as it's published. A new template, or a new variable, also needs a backend deploy.

The education site has its own templates, built from `vetud-education/emails/`.
