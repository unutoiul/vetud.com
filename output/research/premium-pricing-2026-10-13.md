# Retail price increase and currency coverage

The user selected “Double all prices (100% higher)” on October 13, 2026.

| Product | 10 mg (USD) | 20 mg (USD) | 40 mg (USD) | 10 ml (USD) |
| --- | ---: | ---: | ---: | ---: |
| Retatrutide | 198 | 318 | 458 | — |
| Semaglutide | 138 | 198 | 338 | — |
| Tirzepatide | 158 | 238 | 358 | — |
| Selank Nasal Spray | — | — | — | 178 |
| Semax Nasal Spray | — | — | — | 178 |

Every previously set retail price doubles exactly in its own currency, including the existing regional prices for Retatrutide 40 mg. Missing EUR prices use the new USD price divided by the EUR/USD exchange rate, rounded up to whole units. Missing other currencies use the new EUR price and the recorded rate, rounded to whole units to match the store's currency conversion plugin.

Exchange-rate feed: https://latest.currency-api.pages.dev/v1/currencies/eur.json (dated 2026-10-13). The reproducible rate snapshot is in `apps/backend/src/seed/premium-product-prices.ts`. Enabled markets: USD, EUR, GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON and ISK. The existing nightly currency job continues to update converted currencies from each variant's EUR retail price; USD remains manually priced.

Migration 08 marks each product with a pricing revision so a repeat deployment cannot apply the increase a second time. Product IDs, variant IDs, images, stock, inventory settings and publication status are retained.

Validation: backend lint and TypeScript checks; local public API checks of all 132 prices (11 variants × 12 currencies), exact doubling of previous prices, and retention of images, product metadata, SKU and inventory. A second workflow run skips the already priced products.
