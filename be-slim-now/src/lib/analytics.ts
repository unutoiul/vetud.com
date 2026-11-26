/**
 * Google Analytics 4 and Microsoft Clarity. Each one is on when its ID is set (Vercel → Settings →
 * Environment Variables, then redeploy: NEXT_PUBLIC_* values are built into the page):
 *
 * - NEXT_PUBLIC_GA_ID: the GA4 measurement ID, "G-XXXXXXXXXX" (Admin → Data streams → the web stream).
 * - NEXT_PUBLIC_CLARITY_ID: the Clarity project ID (Settings → Overview → Project ID). Defaults to
 *   the "Be Slim Now" project, zjowjn818r, so Clarity is on without it.
 *
 * Visitors in the EEA, the UK and Switzerland are asked first (CookieConsent). Until they accept,
 * Google gets cookieless pings only (Consent Mode) and Clarity records without cookies. Elsewhere
 * both run normally, and anyone can change their mind from "Cookie settings" in the footer.
 * Nothing is shared for advertising anywhere: ad storage stays denied for both.
 */

const clean = (value: string | undefined, pattern: RegExp) => {
  const id = value?.trim() ?? ""
  return pattern.test(id) ? id : ""
}

export const GA_ID = clean(process.env.NEXT_PUBLIC_GA_ID, /^G-[A-Z0-9]+$/i)
export const CLARITY_ID = clean(process.env.NEXT_PUBLIC_CLARITY_ID || "zjowjn818r", /^[a-z0-9]+$/i)
export const ANALYTICS_ENABLED = Boolean(GA_ID || CLARITY_ID)

/** The visitor's answer, kept in this browser. */
export const CONSENT_KEY = "beslimnow:analytics-consent"
/** Fired by the footer's "Cookie settings" to show the choice again. */
export const OPEN_CONSENT_EVENT = "beslimnow:open-consent"

export type Consent = "granted" | "denied"

/** Where analytics cookies need a yes first: the EEA, the UK and Switzerland (Google's region list). */
export const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT",
  "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
]

/**
 * Whether the browser's clock is set to a European time zone. The page is prebuilt, so it can't see
 * where the visit comes from; together with the price country this decides who is asked.
 */
export function europeanTimeZone(): boolean {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
    return /^Europe\//.test(zone) || /^Atlantic\/(Reykjavik|Faroe|Canary|Madeira|Azores)$/.test(zone) || /^Asia\/(Nicosia|Famagusta)$/.test(zone)
  } catch {
    return false
  }
}

export function storedConsent(): Consent | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === "granted" || value === "denied" ? value : null
  } catch {
    return null
  }
}

type Gtag = (...args: unknown[]) => void
type Clarity = (...args: unknown[]) => void

/** Saves the answer and passes it to whichever trackers have loaded (the rest read it on load). */
export function saveConsent(choice: Consent) {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice)
  } catch {
    // Private mode or blocked storage: the choice holds for this visit only.
  }
  const w = window as unknown as { gtag?: Gtag; clarity?: Clarity }
  w.gtag?.("consent", "update", { analytics_storage: choice })
  w.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: choice })
}

/**
 * The inline start-up code for each tracker. It sets the consent defaults before anything is
 * measured, then applies an answer saved on an earlier visit.
 */
export function gaBootstrap(): string {
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(CONSENT_REGIONS)},wait_for_update:500});
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'granted'});
try{var saved=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(saved==='granted'||saved==='denied')gtag('consent','update',{analytics_storage:saved});}catch(e){}
gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID)});`
}

/** Clarity stays off on a local copy of the site (localhost), so testing never shows up in the recordings. */
export function clarityBootstrap(): string {
  return `if(!/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_ID)});
try{var saved=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(saved==='granted'||saved==='denied')window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:saved});}catch(e){}}`
}
