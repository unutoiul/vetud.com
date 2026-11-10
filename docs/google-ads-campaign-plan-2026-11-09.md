# VETUD Google Ads campaign plan

Prepared 9 November 2026. Owner confirmed vetud.com, UK-first targeting and a strict US$10/day maximum in this conversation. This is a proposed plan, not a live campaign. Google Ads discovery returned no connected Google Ads account. No campaign or account settings were changed.

## Decision

Prepare one small UK Search campaign for an eligible offer. Product and destination eligibility, working paid-order tracking and account-level budget checks must be resolved before activation. The existing readiness audit does not clear any SKU for advertising. If no commercially useful offer qualifies, do not spend on Google Ads for this catalog.

The earlier project audit is the source for catalog, market and storefront findings. These have not been independently re-audited here: the public UK storefront could not be fetched by the web research tool. Current Google documentation was checked for spending limits, location targeting, responsive search ads and healthcare restrictions.

## 1. Account review after connection

Read the Google Ads customer ID, business identity, billing currency, account timezone, account/policy status, verification requirements, all enabled campaigns and budgets, and the most recent 30 and 90 days of performance. Inspect spend, clicks, search terms, keyword match types, conversion actions, attribution settings and paid-order revenue. Check linked GA4 properties and tagging separately; connecting Ads does not connect GA4 automatically.

Use existing useful campaigns and tracking where appropriate rather than duplicating them. The US$10 maximum applies across VETUD campaigns, including any existing spend. Do not change unrelated campaigns to make room without agreement.

Obtain UK-only Keyword Planner volumes, bid ranges and forecasts for the eligible seed list. Windsor access to Google Ads does not establish access to Keyword Planner forecasting; verify available capabilities and use the Ads interface if necessary. No CPC, traffic or sales forecast is presented as account data in this plan.

## 2. Offer eligibility

Google restricts healthcare advertising and prescription terms in ads, keywords and landing pages. Its monitored prescription list includes semaglutide and tirzepatide. Hold these out of the proposed campaign. Other research compounds and laboratory supplies require individual review; a research-use label does not establish permission. Assess the actual products, presentations, business model, destination and wider linked catalog. Sources: [Healthcare and medicines](https://support.google.com/adspolicy/answer/176031?hl=en), [prescription-drug list](https://support.google.com/adspolicy/answer/2430794?hl=en).

Use the existing `google-ads-policy-review-draft-2026-11-09.md` to prepare a product-specific eligibility inquiry. It remains unsent. Establish any applicable regulatory classification and certification requirements before promotion. Ads approval alone is not evidence of lawful sale.

First evaluate whether a genuine laboratory-supply offer is eligible and has enough margin to justify acquisition costs. Do not assume that bacteriostatic water or syringes qualify. Brand ads also require destination review. Do not hide the catalog, cloak content or create an education page that funnels users to prohibited sales.

## 3. Proposed campaign settings

| Setting | Proposal |
|---|---|
| Campaign name | VETUD / UK / Search / Eligible Offer / Test 01 |
| Initial status | Paused until reviewed and specifically approved for activation |
| Objective | Confirmed paid orders for an eligible offer |
| Network | Google Search only for the initial test; Search Partners off; Display expansion off |
| Geography | United Kingdom; Presence: people in or regularly in the UK |
| Creative | English copy and a matching UK page with GBP prices |
| Offer scope | One commercially viable eligible offer initially |
| Match types | Exact and phrase initially; inspect close-variant traffic |
| Initial bidding | Proposed Maximize Clicks with an economically justified CPC ceiling, subject to account history and supported controls |
| Devices and schedule | All devices initially; schedule follows actual order/support capability and account timezone |
| Expansion | Europe, UAE and Saudi Arabia deferred; new markets need separate eligibility, shipping, localization and budget decisions |

Presence targeting is a deliberate choice for this UK-only test. Google's default may also include people interested in the UK. Verify the advanced setting in the actual account. Source: [Advanced location options](https://support.google.com/google-ads/answer/1722038?hl=en).

Keep automatic budget increases, automatically applied keyword expansion, dynamic keyword insertion, generated medical claims and automatic destination expansion out of the initial setup. Use explicit reviewed copy and URLs. These are proposed controls; availability must be verified in the account.

## 4. Spend control

Google's standard average daily budget is not a hard daily cap. For most campaigns, the daily billed-media limit is twice the average daily budget and uses the highest budget set that day. The usual full-month limit is 30.4 times that budget. Source: [Spending limits](https://support.google.com/google-ads/answer/10486637?hl=en).

For campaigns subject to that rule, combined average daily budgets must be no more than US$5 equivalent to keep daily billed media at or below US$10. A US$5 unchanged average budget corresponds to a US$152 full-month media limit. Existing campaigns count toward the combined amount.

Use US$4/day equivalent as a provisional planning allowance, giving US$8/day billed-media headroom under the 2x rule and a US$121.60 unchanged full-month media limit. This is not an applied budget or an all-in guarantee. Before setting it, calculate room for applicable taxes, surcharges, billing/payment fees and currency movement. A GBP account requires a conservative conversion and review of the dollar ceiling. If an all-in US$10 limit cannot be established, keep the campaign paused until the owner agrees a workable account-currency limit. Define the budget day in the account timezone; Bangkok, UK and account days may differ.

Do not use a higher budget for part of the day and then lower it to claim compliance. Alerts and automated pauses are supplementary because reporting can lag. Do not rely on a campaign-total budget alone to impose a daily ceiling. No budget changes are authorized by this planning document.

## 5. Keyword and ad-group draft

These are conditional research seeds, not approved keywords or measured search demand. Activate only the group that matches the eligible offer. Do not add broad catalog terms merely to generate more clicks.

| Group | Exact seeds | Phrase seeds | Destination |
|---|---|---|---|
| Brand, optional | [vetud], [vetud uk] | "vetud laboratory supplies" | Approved UK brand/catalog page |
| Eligible laboratory offer | [laboratory supplies uk], [research laboratory supplies] | "laboratory supplies uk", "research lab supplies" | Approved offer page that actually satisfies that query |

The generic laboratory seeds may be too broad for the current narrow catalog. Replace them with 5-10 precise product/type queries after eligibility and Keyword Planner research. If they do not match the real offer, do not use them. Keep brand as a separate ad group for reporting; leave it paused if brand demand is negligible or the budget is better used on qualified acquisition.

Starter negative themes: jobs, careers, salary, free, pdf, course, dosing, dosage, "how to inject", "weight loss", bodybuilding and "before and after". Choose match types carefully and add singular/plural variations where needed. Review real search terms before excluding terms with legitimate buyer intent. Do not use negative keywords as a substitute for product eligibility.

## 6. Conditional responsive search ad

Use only if the laboratory-supply offer and destination qualify and all wording accurately describes the page. These assets make no efficacy, certification, purity or delivery-speed claim. Headlines are within 30 characters and descriptions within 90. Google can combine assets in different orders, so every combination must remain accurate. Source: [Responsive search ads](https://support.google.com/google-ads/answer/7684791?hl=en).

Headline options:

- VETUD Laboratory Supplies
- Research Laboratory Supplies
- Explore Product Details
- View Available Products
- Compare Available Options
- Check Product Specifications
- Browse VETUD Online
- See Delivery Information

Description options:

- Explore VETUD laboratory supplies. Review product specifications before ordering.
- Compare available options and read delivery information on our UK storefront.
- Visit VETUD for product details, current availability and ordering information.

Final URL: the exact approved UK offer URL, to be selected after review. Display paths: lab / supplies, only if accurate. Conditional sitelinks: Product Details, Delivery Information, Returns, Contact VETUD; verify each actual URL and destination before adding. Do not invent COAs, clinical benefits, local warehouses or delivery promises. Create a second distinct ad only when there is a useful additional message and a suitable approved destination.

## 7. Landing page and measurement

The selected page must show the genuine merchant identity, exact offer, current GBP price, stock, product specifications, intended use, shipping costs/times, returns and contact details. Verify UK checkout and payment completion on mobile and desktop. Any eligibility-driven edits must accurately represent the business and catalog.

The prior audit found no Ads/GA4 tag integration in the checked source and noted privacy wording that says advertising cookies are not used. Recheck the live site before implementation. Add actual measurement IDs, suitable consent handling and accurate privacy/cookie information before deploying tags.

Primary conversion: a confirmed paid order, using a unique transaction ID, actual value and currency. Do not count a pending bank/crypto order or an unpaid order-created event as a paid purchase. Use either a validated native Ads purchase conversion or a validated GA4 purchase import as the primary bidding action, avoiding duplicate primary counting. Add-to-cart and checkout starts are diagnostic secondary events.

Verify consent accepted/refused, a successful payment, payment failure, page refresh, duplicate payment callbacks and transaction reconciliation. Do not put names, email addresses, health conditions or sensitive product information in analytics event parameters. Review enhanced conversions and audience eligibility before use. Do not build health-based remarketing or Customer Match audiences by default. Source: [Restricted personalized targeting](https://support.google.com/adspolicy/answer/143465?hl=en).

## 8. Economics and review rules

Calculate contribution per paid order = net sales less product cost, packing, shipping subsidy, payment fees and expected returns. Set allowable acquisition cost below that contribution, leaving the desired profit. Initial CPC ceiling = allowable acquisition cost x a defensible paid-order conversion rate. Without an observed conversion rate, use an explicit conservative assumption for planning and replace it with evidence. Do not invent a profitable bid from the budget alone.

Illustration only: US$20 allowable acquisition cost x 2% assumed paid-order conversion rate = US$0.40 CPC ceiling. These are not VETUD results or a recommended applied bid. If relevant auctions require more than the economics permit, reconsider the offer or channel rather than increase spend automatically.

Review paid purchases, cost per paid purchase, conversion value/cost and contribution after advertising; report brand and nonbrand separately. Review click-through rate, CPC and query relevance as diagnostics. At this budget, 30 days may yield too few purchases to establish profitability.

## 9. First 30 days after eligibility and activation

| Window | Work and decision |
|---|---|
| Before day 1 | Connect and inspect account; establish eligible offer; obtain keyword forecasts; validate destination and tracking; calculate currency/fees and total budget; review the paused setup and approve activation |
| Days 1-3 | Check policy status, UK presence setting, billing budget, actual queries, page availability and conversion receipts daily; pause for wrong geography, broken checkout, invalid tracking or policy problems |
| Days 4-7 | Remove irrelevant queries, add measured negatives, inspect device/page behavior; keep settings stable unless evidence requires a change |
| Days 8-14 | Compare paid orders and contribution with allowable CPA; investigate attribution delay and refunds before judging results |
| Days 15-30 | Continue only where economics and query quality justify it; review conversion bidding only when tracking and purchase data support it; do not force a calendar-based switch |

Proposed loss-control rule: investigate a keyword/ad group after it spends one allowable CPA without a paid order, and pause at two allowable CPAs without a paid order after accounting for conversion delay. This is a business test limit, not statistical proof of failure. Agree the actual CPA and maximum test loss before activation. Spend or budget increases require a new decision and must respect the strict daily ceiling.

Deliverable status: plan prepared. Account access, product clearance, forecasts, tracking implementation, live-page verification and paused campaign construction remain dependent work. No ads have been launched and no money has been spent by this task.
