/** ISO 3166-1 alpha-2 codes for the shipping country picker. Names come from Intl.DisplayNames. */
const CODES =
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FO FR GA GB GD GE GH GI GL GM GN GR GT GU GW GY HK HN HR HT HU ID IE IL IN IQ IS IT JM JO JP KE KG KH KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NZ OM PA PE PF PG PH PK PL PR PS PT PY QA RE RO RS RW SA SB SC SE SG SI SK SL SM SN SO SR SV SZ TC TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VC VE VG VI VN VU WS XK ZA ZM ZW".split(
    " ",
  )

export const COUNTRY_CODES: readonly string[] = CODES

const names = new Intl.DisplayNames(["en"], { type: "region" })

export const countryName = (code: string) => names.of(code.toUpperCase()) ?? code.toUpperCase()

export const COUNTRY_OPTIONS = CODES.map((code) => ({ value: code, label: countryName(code) })).sort((a, b) =>
  a.label.localeCompare(b.label, "en"),
)
