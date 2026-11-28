# VETUD Tirzepatide & Retatrutide pens: one-page order site

One page that sells two products, Tirzepatide (TZ-2) and Retatrutide pens by VETUD, at 20 mg or 40 mg. There's no cart and no account: **Buy now** opens one short form, the buyer gets a confirmation email with payment details, and the owner gets an order alert. Every order and pop-up signup is also saved in the VETUD shop's database, in the tables `beslimnow_orders` and `beslimnow_subscribers` (every row marked `source = 'beslimnow'`). This site posts them to the shop's backend (`SHOP_API_URL/beslimnow/*` with `BESLIMNOW_API_SECRET`); the tables are defined in `vetud-shop/backend/src/modules/beslimnow`.

On top of that:

- **Black Friday offer:** a percentage off every regular price (50% now, `OFFER.salePercent`; every percentage on the page, in the title and in the emails follows it). The regular price is shown struck through; buyers pay the offer price.
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
| Every word on the page (headings, buttons, FAQ, form labels, badges, product texts) | `src/i18n/messages/<country>.json`, see [Page text by country](#page-text-by-country) |
| Product names, label codes, pictures | `src/config/site.ts` (`PRODUCTS`) |
| Prices, one list per currency (USD, EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON) | `src/config/site.ts` (`PRICE_LISTS`) |
| Which countries are in the country picker, their currency and number format | `src/config/markets.ts` (`MARKETS`) |
| The launch offer (percent) and the subscriber discount percent | `src/config/site.ts` (`OFFER`); `salePercent: 0` ends the sale. The label ("Black Friday") is `offer.saleLabel` in the message files (`OFFER.saleLabel` is the emails' copy) |
| The subscriber code itself | env var `PROMO_CODE` (default `VETUD10`) |
| Telegram / WhatsApp / LINE / email | `src/config/site.ts` (`CONTACTS`). An empty value hides that button |
| Colours, fonts, Ant Design theme | `src/theme/tokens.ts` (every colour is a named token there) |
| Page sections | `src/components/*` (PromoBar, Header, Hero, Products, HowToOrder, Quality, Faq, Footer) |
| Hero: word timing and the three selling points under the headline | timing in `src/components/Hero.tsx` (`HEADLINE_START`, `WORD_GAP`); the points are `hero.offerPoint`, `hero.weightPoint` and `hero.appetitePoint` in the message files (the weight figure is retatrutide in `TRIAL_DATA`, `src/config/site.ts`); the pieces are in `src/components/animated.tsx` |
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

## Page text by country

All the page's words live in `src/i18n/messages`, one JSON file per country in the picker (`us.json`, `de.json`, `gb.json`… 46 files). **`us.json` is the English source.** Every other file is translated into its country's language (32 languages, from each country's locale in `src/config/markets.ts`).

- **Languages.** `LANGUAGES` in `scripts/translations.mjs` lists each language and its countries; the first country's file holds the translation and the others get a copy (Germany → Austria, Liechtenstein and, with "ss" for "ß", Switzerland; France → Luxembourg, Monaco; Italy → San Marino, Vatican; Greece → Cyprus; Romania → Moldova; Netherlands → Belgium; Albania → Kosovo; Britain → Ireland, Malta).
- **After changing English text:** `npm run i18n:sync` (adds new keys in English), then `npm run i18n:translations -- --stale` lists, per language, the texts whose English changed since they were translated. Translate those in the first country file of each language and run `npm run i18n:translations -- de fr …`: it checks numbers, placeholders, tags, brand names (`scripts/translation-glossary.json`) and list lengths against `us.json`, copies the file to that language's other countries and records which English it was made from (`src/i18n/translations.json`). `-- --check` re-checks every language without changing anything.

- **Which file.** The page uses the visitor's country (the same one that sets the prices). Choosing another country in the header, or a picker country as Ship to in the order form, loads that country's file and every section switches. Each file is its own small chunk, so a page only downloads its own country's words.
- **Translating.** Change only the words. Keep the keys, every `{placeholder}` (`{price}`, `{percent}`, `{saleLabel}`…, filled in by the page), every `<b>…</b>` tag, and the number of items in a list. `hero.headlineLineOne` / `headlineLineTwo` are the headline's words, one per item, as they rise in.
- **`npm run i18n:check`** lists missing files, missing or extra keys and placeholders that don't match `us.json`.
- **`npm run i18n:sync`** after adding text to `us.json` (or a country to `MARKETS`): creates missing files as copies of `us.json`, adds new keys in English to every file and removes keys `us.json` no longer has. It never overwrites text that's already there.
- **Not in the files:** prices and percentages (`src/config`), product and molecule names, country names in the pickers (from the browser, in English for now), messages from the server (order errors) and the emails (Resend templates, English). The page title and description are `meta` in each file.

## Hero animation

The headline rises in word by word, "50% off." counts up with a brighter green light gliding through it and a green stroke drawn underneath, three short selling points follow (−50% off every pen; 24.2% average weight lost in retatrutide's 48-week trial, counting up; less hunger through GIP and GLP-1), the pens glide in, float and lean toward the mouse, and the offer seal spins in with a soft pulse.

- **The two guarantees** (refund if a lot tests below 99% purity; reship or refund if a parcel is lost) are written out under the Buy button (`hero.guarantees` in the message files) and in the FAQ (`faq.items`). If the policy changes, change both.
- **Entrances are CSS animations** in the server HTML (`enter()` in `animated.tsx`), so they play on first paint and the hero is never blank while JavaScript loads. The background picture only scales (no fade), so it still counts as painted at once for Largest Contentful Paint (about 0.55 s locally).
- **Everything live** (count-ups, light sweeps, floating, mouse parallax, hover) uses [Motion](https://motion.dev) (`motion` package, pinned).
- Visitors with "reduce motion" on get plain fades and no loops. Screen readers hear the headline once, in full.

The pop-up opens by itself after 12 seconds or when the mouse leaves the page, at most once every three days per browser, never over the order form, and never again once the visitor has the code.

## Emails (Resend templates)

All emails are Resend templates, built from `emails/` with the same VETUD Peptide Series layout as the shop's emails:

- `order-confirmation` to the buyer: the order, the savings, the total, how to pay and the contact links. Reply-to is the site address (`SITE.email`, contact@beslimnow.com, forwarded to contact@vetud.com).
- `order-admin` to `STORE_OWNER_EMAIL`: every field the buyer filled in. Reply-to is the buyer.
- `promo-code` to a new subscriber: their code. Reply-to is the site address too.
- `subscribe-admin` to `STORE_OWNER_EMAIL`: who subscribed.

```bash
npm run emails:build     # checks the templates, writes emails/dist/
npm run emails:publish   # creates/updates and publishes them in Resend, then writes src/lib/email/template-ids.ts
```

`publish` needs `RESEND_API_KEY` (from the environment, `.env.local`, or `vetud-shop/backend/.env`). Commit the updated `emails/templates.json` and `src/lib/email/template-ids.ts`, then redeploy. The sender address in `RESEND_FROM_EMAIL` must be on a domain verified in Resend.

Customer emails end with an unsubscribe link to `/unsubscribe`, signed with `BESLIMNOW_API_SECRET` (`src/lib/email/unsubscribe.ts`); the button there marks the contact as unsubscribed in Resend. Without the secret, the link falls back to an email to contact@vetud.com. Owner emails (`"audience": "owner"`) have none. Subscribers are saved in the Resend segment "VETUD Shop + BeSlimNow subscribers" (shared with the shop; the plan allows three segments) with `source` = "BeSlimNow pen page" and `country`.

### Campaigns (Resend Broadcasts)

Marketing emails live in `emails/campaigns/`: `<name>.html` + `<name>.txt`, with subject, preview text, sender and Resend segment in `campaigns.json`. Prices in a campaign are written in by hand, so check them against `src/config/site.ts` when the offer changes.

```bash
npm run emails:campaign-images            # pictures → public/brand/email/campaign/ (JPEG; deploy before sending)
npm run emails:campaign -- black-friday-2026   # creates/updates the Resend Broadcast draft; never sends
```

Review the draft in Resend → Broadcasts, send yourself a test, then send it there. Only mail people who subscribed: every campaign carries an unsubscribe link (`{{{RESEND_UNSUBSCRIBE_URL}}}`).

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

## Search engines and analytics

- Every country's page is indexed at its own address (`/` for the US, `/de`, `/fr`, `/gb`…) with hreflang links between them and `x-default` → `/` (`src/lib/seo.ts`); `/us` points at `/` and `/xk` at `/al`. `/sitemap.xml` (`src/app/sitemap.ts`) lists those pages; `/robots.txt` (`src/app/robots.ts`) points every crawler to it. Submit `https://www.beslimnow.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools (Bing can import the site from Search Console).
- Google Analytics 4 and Microsoft Clarity load when `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_CLARITY_ID` are set (`src/components/Analytics.tsx`, settings in `src/lib/analytics.ts`). Redeploy after setting them.
- Visitors on a European price list or a European clock get a small cookie question (`CookieConsent.tsx`, text in the messages under `consent`). Until they accept, GA gets cookieless pings only (Consent Mode, EEA/UK/CH) and Clarity records without cookies. "Cookie settings" in the footer asks again. Ad storage is denied everywhere.
- Optional: `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` add the "HTML tag" ownership meta tags.

## Deploy (Vercel)

A separate Vercel project whose root is this folder. Add the env vars from `.env.example` (with `NEXT_PUBLIC_SITE_URL` set to the real domain) and deploy. The spam limits on the order and subscribe routes are kept in memory per server instance.
