import { Button, Section, Text } from "@react-email/components"
import { formatMoney, orderNumber } from "./_lib/format"
import { EmailLayout, styles } from "./_lib/layout"
import { OrderSummary, previewOrder } from "./_lib/order-summary"
import type { OrderPlacedEmailData } from "./_lib/types"

export type OrderPlacedAdminEmailData = OrderPlacedEmailData & { admin_url: string }

export const orderPlacedAdminSubject = ({ order }: OrderPlacedAdminEmailData) =>
  `New order ${orderNumber(order)}: ${formatMoney(order.total, order.currency_code)}`

export default function OrderPlacedAdminEmail({ order, admin_url, admin_payment_action }: OrderPlacedAdminEmailData) {
  const number = orderNumber(order)

  return (
    <EmailLayout preview={`New order ${number} from ${order.email ?? "a customer"}`}>
      <Text style={styles.eyebrow}>New order</Text>
      <Text style={styles.heading}>
        {number} · {formatMoney(order.total, order.currency_code)}
      </Text>
      <Text style={styles.text}>
        {order.email ?? "A customer"} placed an order. {admin_payment_action ?? "Check the selected payment method and confirm payment before shipping."}
      </Text>

      <OrderSummary order={order} />

      <Section style={{ marginTop: "28px" }}>
        <Button href={`${admin_url}/app/orders/${order.id}`} style={styles.button}>
          Open in Medusa Admin
        </Button>
      </Section>
    </EmailLayout>
  )
}

OrderPlacedAdminEmail.PreviewProps = {
  order: previewOrder,
  storefront_url: "http://localhost:8000",
  admin_url: "http://localhost:9000",
} satisfies OrderPlacedAdminEmailData
