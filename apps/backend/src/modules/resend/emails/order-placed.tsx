import { Button, Section, Text } from "@react-email/components"
import { formatMoney, orderNumber } from "./_lib/format"
import { EmailLayout, styles } from "./_lib/layout"
import { OrderSummary, previewOrder } from "./_lib/order-summary"
import type { OrderPlacedEmailData } from "./_lib/types"

export const orderPlacedSubject = ({ order }: OrderPlacedEmailData) =>
  `Order ${orderNumber(order)} received`

export default function OrderPlacedEmail({
  order,
  storefront_url,
  payment_instructions,
  bank_details,
  manual_payment = true,
  payment_summary,
}: OrderPlacedEmailData) {
  const number = orderNumber(order)
  const name = order.shipping_address?.first_name

  return (
    <EmailLayout preview={`We've received order ${number}. View your order and payment details.`}>
      <Text style={styles.eyebrow}>Order {number}</Text>
      <Text style={styles.heading}>Thank you{name ? `, ${name}` : ""}. Your order is reserved.</Text>
      <Text style={styles.text}>
        {payment_summary ?? "We have received your order and reserved the stock. It ships as soon as your payment is confirmed."}
      </Text>

      {manual_payment ? <Section style={styles.panel}>
        <Text style={{ ...styles.eyebrow, margin: "0 0 6px" }}>How to pay</Text>
        <Text style={{ ...styles.text, margin: "0 0 8px" }}>
          Amount due: <strong>{formatMoney(order.total, order.currency_code)}</strong>
          <br />
          Payment reference: <strong>{number}</strong>
        </Text>
        {payment_instructions ? (
          <Text style={{ ...styles.text, margin: "0 0 8px" }}>{payment_instructions}</Text>
        ) : null}
        {bank_details ? (
          <Text style={{ ...styles.muted, whiteSpace: "pre-line" }}>
            {bank_details.split(" | ").join("\n")}
          </Text>
        ) : null}
      </Section> : null}

      <OrderSummary order={order} />

      <Section style={{ marginTop: "28px" }}>
        <Button href={`${storefront_url}/contact`} style={styles.button}>
          Questions? Contact us
        </Button>
      </Section>
    </EmailLayout>
  )
}

OrderPlacedEmail.PreviewProps = {
  order: previewOrder,
  storefront_url: "http://localhost:8000",
  payment_instructions:
    "Pay by bank transfer within 3 business days. Use your order number as the payment reference.",
  bank_details: "Account name: Vetud Peptides | IBAN: XX00 0000 0000 0000 | BIC: XXXXXXXX",
} satisfies OrderPlacedEmailData
