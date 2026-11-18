# Education email templates

Every vetud.com email is a published template in Resend: password reset, welcome, sign-in code, email-list confirmation (English and French), admin invitation, and the two owner emails (contact form, new email-list subscriber). This folder is their source. They have their own templates, separate from the shop's, so a change to the shop's emails never reaches vetud.com.

The layout in `build.mjs` matches the shop's emails (`vetud-shop/emails`): the VETUD Peptide Series logo, which the owner chose for both sites and which is served from pep.company, a white 600px card with a navy rule, Manrope, sentence-case navy buttons, and the education notice at the bottom. Links go to vetud.com only; `build.mjs` refuses any link to the shop.

`templates/<name>.html` holds each email's body rows and `templates/<name>.txt` its plain-text version. `templates.json` has each template's Resend ID, name, subject, preview text, variables and language. The backend only fills in the variables (`backend/src/modules/resend/templates.ts`) and sends the template by its ID (`template-ids.ts`).

```bash
node build.mjs     # checks every template and writes dist/
node publish.mjs   # creates or updates, publishes and reads back each template, then rewrites template-ids.ts
node publish.mjs sign-in-code   # only the templates named
```

`publish.mjs` needs `RESEND_API_KEY` in the environment or in `backend/.env`. Template names are limited to 50 characters, and Resend reserves some variable names, such as `EMAIL`. An edited template goes live as soon as it's published; a new template or variable also needs a backend deploy.
