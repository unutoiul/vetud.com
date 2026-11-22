# VETUD Tirzepatide & Retatrutide pens: one-page order site

One page that sells two products, Tirzepatide (TZ-2) and Retatrutide pens by VETUD, at 20 mg or 40 mg. There's no cart and no account: **Buy now** opens one short form, the buyer gets a confirmation email with payment details, and the owner gets an order alert. There's no database; those emails are the order record.

On top of that:

- **Launch offer:** a percentage off every regular price (40% now). The regular price is shown struck through; buyers pay the offer price.
- **Subscriber code:** a pop-up offers an extra 10% for an email address. The visitor gets the code on screen and by email, it's filled into their order form, and the server checks it before giving the discount. Subscribers are saved as Resend contacts.

Built with Next.js 16, React 19 and Ant Design 6. It is independent of `vetud-shop/` and `vetud-education/` and shares no code with them.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have; without RESEND_API_KEY emails print to the console
npm run dev                  # http://localhost:8200
npm run lint && npm run typecheck && npm run build
```

## What to change, where

| What | File |
|---|---|
| Prices, names, badges ("Best seller", "Very popular"), texts, pictures | `src/config/site.ts` (`PRODUCTS`) |
| The launch offer (percent, label) and the subscriber discount percent | `src/config/site.ts` (`OFFER`); `salePercent: 0` ends the sale |
| The subscriber code itself | env var `PROMO_CODE` (default `VETUD10`) |
| Telegram / WhatsApp / LINE / email | `src/config/site.ts` (`CONTACTS`). An empty value hides that button |
| Colours, fonts, Ant Design theme | `src/theme/tokens.ts` (every colour is a named token there) |
| Page sections | `src/components/*` (PromoBar, Header, Hero, Products, HowToOrder, Quality, Faq, Footer) |
| The order form / the pop-up | `src/components/OrderModal.tsx` / `src/components/PromoModal.tsx` |
| Payment details in the buyer's email | env vars `PAYMENT_INSTRUCTIONS`, `PAYMENT_BANK_DETAILS`, `PAYMENT_CRYPTO_DETAILS` |
| Email wording and layout | `emails/templates/*.html` + `.txt`, then `npm run emails:publish` |

The server never trusts a price sent by the browser: `POST /api/order` works out the total from `src/config/site.ts` and the code from `PROMO_CODE`.

The pop-up opens by itself after 12 seconds or when the mouse leaves the page, at most once every three days per browser, never over the order form, and never again once the visitor has the code.

## Emails (Resend templates)

All emails are Resend templates, built from `emails/` with the same VETUD Peptide Series layout as the shop's emails:

- `order-confirmation` to the buyer: the order, the savings, the total, how to pay and the contact links. Reply-to is the owner.
- `order-admin` to `STORE_OWNER_EMAIL`: every field the buyer filled in. Reply-to is the buyer.
- `promo-code` to a new subscriber: their code.
- `subscribe-admin` to `STORE_OWNER_EMAIL`: who subscribed.

```bash
npm run emails:build     # checks the templates, writes emails/dist/
npm run emails:publish   # creates/updates and publishes them in Resend, then writes src/lib/email/template-ids.ts
```

`publish` needs `RESEND_API_KEY` (from the environment, `.env.local`, or `vetud-shop/backend/.env`). Commit the updated `emails/templates.json` and `src/lib/email/template-ids.ts`, then redeploy. The sender address in `RESEND_FROM_EMAIL` must be on a domain verified in Resend.

## Pictures

`npm run images` rebuilds `public/images/` from VETUD's own artwork: the closed and open boxes from `assets/vetud_product_white_background/`, the reusable pen from `assets/VETUD_Reusable_Dual_Chamber_Pen_poster.png` (cut out of its background), and the alpine background from the shop.

## Deploy (Vercel)

A separate Vercel project whose root is this folder. Add the env vars from `.env.example` (with `NEXT_PUBLIC_SITE_URL` set to the real domain) and deploy. The spam limits on the order and subscribe routes are kept in memory per server instance.
