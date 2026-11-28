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

The four book templates use the storefront’s email-sized JPEG. Deploy the storefront assets first. From the backend directory, `npx medusa exec ./src/scripts/update-book-listing.ts` updates the existing Stripe product with its cover and title. From this directory, `node publish.mjs book-offer book-checkout-started book-purchase book-owner-alert` publishes the book emails.

Readers' emails end with an unsubscribe link (owner, 2026-11-28; in French for the French confirmation). The backend fills `UNSUBSCRIBE_URL` with a signed link to `/<lang>/newsletter/unsubscribe`; when it's missing, Resend uses the fallback, an email to contact@vetud.com. Templates marked `"audience": "owner"` in `templates.json` (owner alerts, contact form, admin invitation) have no link.

Confirmed email-list subscribers are also Resend contacts (`backend/src/lib/resend-contacts.ts`), in the segment "VETUD Learn email list (vetud.com)", with `source` = "vetud.com email list" and `language`. They're added when they confirm, taken out when they unsubscribe, and `backend/src/jobs/sync-email-list-to-resend.ts` catches up every hour (everything on its first run after a deploy). The shop's subscribers are in a different segment.
