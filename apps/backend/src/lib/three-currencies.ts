/**
 * The owner's markets from 2026-11-05: three currencies. US dollars for the United States, Canada
 * and Australia; pounds for the United Kingdom; euros for every other European country (the EUR
 * region already holds them). Japan, China, Singapore, Hong Kong and the UAE are no longer sold to.
 */
export const THREE_CURRENCY_REVISION = "three-currencies-2026-11-05-v1"

/** The store's currencies; USD stays the base every other price is converted from. */
export const STORE_CURRENCIES = ["usd", "eur", "gbp"]

/** The USD region, and the delivery zone with the same name, take Canada and Australia. */
export const USD_MARKET = { name: "United States, Canada & Australia", countries: ["us", "ca", "au"] }

export const DROPPED_COUNTRIES = ["jp", "cn", "sg", "hk", "ae"]
