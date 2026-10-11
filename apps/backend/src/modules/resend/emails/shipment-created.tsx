import { Button, Link, Section, Text } from "@react-email/components"
import { orderNumber } from "./_lib/format"
import { EmailLayout, styles } from "./_lib/layout"
import { OrderSummary, previewOrder } from "./_lib/order-summary"
import type { ShipmentCreatedEmailData } from "./_lib/types"

export const shipmentCreatedSubject = ({ order }: ShipmentCreatedEmailData) =>
  `Order ${orderNumber(order)} has shipped`

export default function ShipmentCreatedEmail({
  order,
  storefront_url,
  tracking,
}: ShipmentCreatedEmailData) {
  const number = orderNumber(order)
  const labels = tracking.filter((label) => label.tracking_number || label.tracking_url)

  return (
    <EmailLayout preview={`Your Vetud order ${number} is on its way.`}>
      <Text style={styles.eyebrow}>Order {number}</Text>
      <Text style={styles.heading}>Your order is on its way.</Text>
      <Text style={styles.text}>
        Your package has left our facility. Each item ships with its lot documentation.
      </Text>

      {labels.length ? (
        <Section style={styles.panel}>
          <Text style={{ ...styles.eyebrow, margin: "0 0 6px" }}>Tracking</Text>
          {labels.map((label, index) => (
            <Text key={label.tracking_number ?? index} style={{ ...styles.text, margin: "0 0 4px" }}>
              {label.tracking_url ? (
                <Link href={label.tracking_url}>{label.tracking_number || "Track package"}</Link>
              ) : (
                label.tracking_number
              )}
            </Text>
          ))}
        </Section>
      ) : null}

      <OrderSummary order={order} />

      <Section style={{ marginTop: "28px" }}>
        <Button href={`${storefront_url}/documentation`} style={styles.button}>
          Look up lot documentation
        </Button>
      </Section>
    </EmailLayout>
  )
}

ShipmentCreatedEmail.PreviewProps = {
  order: previewOrder,
  storefront_url: "http://localhost:8000",
  tracking: [{ tracking_number: "1Z999AA10123456784", tracking_url: "https://example.com/track" }],
} satisfies ShipmentCreatedEmailData
