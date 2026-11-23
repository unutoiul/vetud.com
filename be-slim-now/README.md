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
| Names, badges ("Best seller", "Very popular"), texts, pictures | `src/config/site.ts` (`PRODUCTS`) |
| Prices, one list per currency (USD, EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON) | `src/config/site.ts` (`PRICE_LISTS`) |
| Which countries are in the country picker, their currency and number format | `src/config/markets.ts` (`MARKETS`) |
| The launch offer (percent, label) and the subscriber discount percent | `src/config/site.ts` (`OFFER`); `salePercent: 0` ends the sale |
| The subscriber code itself | env var `PROMO_CODE` (default `VETUD10`) |
| Telegram / WhatsApp / LINE / email | `src/config/site.ts` (`CONTACTS`). An empty value hides that button |
| Colours, fonts, Ant Design theme | `src/theme/tokens.ts` (every colour is a named token there) |
| Page sections | `src/components/*` (PromoBar, Header, Hero, Products, HowToOrder, Quality, Faq, Footer) |
| Hero animation: word timing, the rotating "Every pen is …" phrases | `src/components/Hero.tsx` (`EVERY_PEN`, `HEADLINE_START`, `WORD_GAP`); the pieces are in `src/components/animated.tsx` |
| The order form / the pop-up | `src/components/OrderModal.tsx` / `src/components/PromoModal.tsx` |
| Payment details in the buyer's email | env vars `PAYMENT_INSTRUCTIONS`, `PAYMENT_BANK_DETAILS`, `PAYMENT_CRYPTO_DETAILS` |
| Email wording and layout | `emails/templates/*.html` + `.txt`, then `npm run emails:publish` |

The server never trusts a price sent by the browser: `POST /api/order` works out the total from `src/config/site.ts` and the code from `PROMO_CODE`.

## Prices by country

Every price on the page is in the visitor's currency, written the way people there write it ("$239", "203 €", "£179", "2 274 kr", "1.043 lei"):

- **Which country.** `src/proxy.ts` picks it on each visit to `/`: the country chosen in the header picker (remembered for a year in the `vetud_pens_country` cookie), else where the visit comes from (Vercel's `x-vercel-ip-country` header), else US prices. The address stays `/`; behind it each country has its own prebuilt page (`src/app/[country]/page.tsx`, also reachable as `/de`, `/gb`…, with `/` as the canonical address), so the right prices show on the first paint.
- **The header picker** lists the United States and every European country we ship to, with flags, each country's own name (Deutschland, Sverige…) and its currency, and is searchable. Choosing one changes every price at once.
- **The order form** starts with **Ship to**, the same flagged list plus every other country we ship to. The order is priced for the country it ships to: its own prices when it's in the picker, US prices anywhere else. The server does the same, and the emails show the total with the currency code ("3 505 kr (SEK)").
- Countries outside the euro area that we don't price in their own currency (Iceland, the Western Balkans, Moldova, Ukraine, Belarus) pay in euros. Russia isn't in the shipping list, so it isn't in the picker either.

Flags in `public/flags` come from country-flag-icons (MIT, see the LICENSE there).

## Hero animation

The headline rises in word by word, "40% off." counts up with a champagne light gliding through it and a gold stroke drawn underneath, a line below cycles through "Every pen is purity-guaranteed / delivery-guaranteed / 40% off this week / ready to ship today / ≥99% pure / COA-backed / discreetly packed", the pens glide in, float and lean toward the mouse, and the offer seal spins in with a soft pulse.

- **The two guarantees** (refund if a lot tests below 99% purity; reship or refund if a parcel is lost) are written out under the Buy button (`GUARANTEES` in `Hero.tsx`) and in the FAQ. If the policy changes, change both, and the rotating phrases.
- **Entrances are CSS animations** in the server HTML (`enter()` in `animated.tsx`), so they play on first paint and the hero is never blank while JavaScript loads. The background picture only scales (no fade), so it still counts as painted at once for Largest Contentful Paint (about 0.55 s locally).
- **Everything live** (count-up, rotating words, light sweeps, floating, mouse parallax, hover) uses [Motion](https://motion.dev) (`motion` package, pinned).
- Visitors with "reduce motion" on get plain fades, no loops, and the rotating line stays on its first phrase. Screen readers hear the headline and the rotating line once, in full.

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

`npm run images` rebuilds `public/images/` from VETUD's own artwork: the closed and open boxes from `assets/vetud_product_white_background/`, the reusable pen from `assets/VETUD_Reusable_Dual_Chamber_Pen_poster.png` (cut out of its background), and the alpine background from the shop. It also grades the filling-line and cold-storage photos in `assets/VETUD_Facility_Photos/` for the "Made clean. Kept cold." section (`src/components/Facility.tsx`): cropped clear of clutter, colour casts evened out, levels, softer saturation, sharpening and a faint vignette. The crop and colour settings for each photo are in the `facility` list in `scripts/prepare-images.mjs`.

## Logo and icons

Everything comes from one file of the owner's logo kit, `public/logos/recommended-04-premium/full-logo-trimmed.png`, so the header, the footer, the emails, the browser tab and the home-screen icon all show the very same B. `npm run brand` makes:

| File | Used for |
|---|---|
| `public/brand/beslimnow-logo.png` | Header |
| `public/brand/beslimnow-logo-white.png` | Footer ("Be" and "Now" in white) |
| `public/brand/email/beslimnow-logo.png` | Emails (on white, 440 px for sharp 220 px display) |
| `src/app/favicon.ico` | Browser tab (16/32/48 px, the B alone) |
| `src/app/apple-icon.png` | iPhone home screen (the B on white) |
| `public/brand/icon-192.png`, `icon-512.png` | Android home screen, via `src/app/manifest.ts` |

The B's S-shaped waist is see-through in the artwork, so the script fills it white and it shows on any background. Next.js adds the icon `<link>` tags on its own.

## Deploy (Vercel)

A separate Vercel project whose root is this folder. Add the env vars from `.env.example` (with `NEXT_PUBLIC_SITE_URL` set to the real domain) and deploy. The spam limits on the order and subscribe routes are kept in memory per server instance.
