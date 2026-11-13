# VETUD welcome email

`customer-welcome.html` and `customer-welcome.txt` are the source of the welcome email published on 13 November 2026 in Resend:

- Template: **VETUD · Welcome (new account)**
- ID: `dd50a68b-070b-4cab-9398-f4d383ee63c3`
- Alias: `vetud-welcome-new-account`
- Subject: `Welcome to VETUD`

Both backends already send this template for new registered accounts through `send-customer-welcome`. Updating and publishing the existing template makes the change live without a backend deployment. Keep these files in sync when editing the Resend template.

Preserve the existing `{{{NAME_SUFFIX}}}` and `{{{STOREFRONT_URL}}}` variables. The backends escape the customer's name before sending it. The storefront variable links back to the site where the account was created; its fallback is `https://www.vetud.com`. Product buttons always link to the matching product at `https://www.pep.company/products/<handle>`, allowing the shop to select the visitor's region.

The design uses the existing Manrope font stack, navy `#15265e`, glacier blue `#8fc6dd`, and pale blue `#edf3fb`. The logo is the live PNG on pep.company. Product photos use the shop's image optimizer, verified to return JPEG for clients that do not request modern image formats. The layout uses presentation tables, inline styles, four 44px purchase buttons and a plain-text alternative.

Before publishing changes, check both desktop and 320px-wide layouts, verify every live image and link, and keep the HTML below Gmail's 102 KB clipping limit. This revision is approximately 13.4 KB. Read the template back after publishing to verify its content; Resend returns the currently published content while an update is still a draft.
