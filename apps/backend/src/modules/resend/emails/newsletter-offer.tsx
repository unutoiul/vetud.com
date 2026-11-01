import { Button, Link, Section, Text } from "@react-email/components"
import { EmailLayout, styles } from "./_lib/layout"
import type { NewsletterOfferEmailData } from "./_lib/types"

const ends = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"

export const newsletterOfferSubject = ({ offer }: NewsletterOfferEmailData) =>
  offer ? `Your ${offer.discount} VETUD code` : "You’re subscribed to VETUD offers and news"

export default function NewsletterOfferEmail({ offer, shop_url, unsubscribe_url }: NewsletterOfferEmailData) {
  return (
    <EmailLayout preview={offer ? `Your code ${offer.code} is inside.` : "Thanks for signing up."}>
      <Text style={styles.eyebrow}>{offer?.headline || "VETUD offers"}</Text>
      <Text style={styles.heading}>{offer ? `Here’s your ${offer.discount} code.` : "You’re subscribed."}</Text>
      {offer ? (
        <Section style={styles.panel}>
          <Text style={{ ...styles.text, margin: 0, fontSize: "26px", fontWeight: 700, letterSpacing: "0.08em" }}>{offer.code}</Text>
          <Text style={{ ...styles.muted, marginTop: "6px" }}>
            Enter it in your cart.{offer.ends_at ? ` Valid until ${ends(offer.ends_at)}.` : ""}
          </Text>
        </Section>
      ) : (
        <Text style={styles.text}>We’ll email you when there’s a new offer or important news.</Text>
      )}
      {offer?.description ? <Text style={styles.text}>{offer.description}</Text> : null}
      <Section style={{ margin: "24px 0" }}>
        <Button href={shop_url} style={styles.button}>Visit the shop</Button>
      </Section>
      <Text style={styles.muted}>
        You’re receiving this because you asked for VETUD offers and news.{" "}
        <Link href={unsubscribe_url}>Unsubscribe</Link>
      </Text>
    </EmailLayout>
  )
}

NewsletterOfferEmail.PreviewProps = {
  offer: { promotion_id: "promo_preview", code: "BLACKFRIDAY15", headline: "Black Friday", description: "15% off all research materials. One code per order; shipping not included.", discount: "15%", starts_at: null, ends_at: "2026-12-01T23:59:00.000Z" },
  shop_url: "http://localhost:8000/us/shop",
  unsubscribe_url: "http://localhost:8000/us/newsletter/unsubscribe?email=researcher%40example.com&token=preview",
} satisfies NewsletterOfferEmailData
