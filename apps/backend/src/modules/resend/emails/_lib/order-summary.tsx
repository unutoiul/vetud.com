import { Column, Row, Section, Text } from "@react-email/components"
import { addressLines, formatMoney } from "./format"
import { colors, styles } from "./layout"
import type { EmailOrder } from "./types"

const cell = { fontSize: "14px", color: colors.ink, margin: 0, lineHeight: "1.5" }
const label = { ...cell, color: colors.muted }

export function OrderSummary({ order }: { order: EmailOrder }) {
  const currency = order.currency_code
  const totals: [string, number | string | null | undefined][] = [
    ["Subtotal", order.item_total],
    ["Shipping", order.shipping_total],
  ]
  if (Number(order.discount_total ?? 0) > 0) {
    totals.push(["Discount", -Number(order.discount_total)])
  }
  if (Number(order.tax_total ?? 0) > 0) {
    totals.push(["Tax", order.tax_total])
  }

  return (
    <>
      <Text style={styles.eyebrow}>Order summary</Text>
      <Section style={{ borderTop: `1px solid ${colors.line}` }}>
        {(order.items ?? []).map((item) => (
          <Row key={item.id} style={{ borderBottom: `1px solid ${colors.line}` }}>
            <Column style={{ padding: "12px 0" }}>
              <Text style={{ ...cell, fontWeight: 600 }}>{item.product_title ?? item.title}</Text>
              <Text style={label}>
                {item.variant_title ? `${item.variant_title} · ` : ""}Qty {item.quantity}
              </Text>
            </Column>
            <Column align="right" style={{ padding: "12px 0", verticalAlign: "top" }}>
              <Text style={cell}>{formatMoney(item.total, currency)}</Text>
            </Column>
          </Row>
        ))}
      </Section>
      <Section style={{ marginTop: "12px" }}>
        {totals.map(([name, value]) => (
          <Row key={name}>
            <Column>
              <Text style={label}>{name}</Text>
            </Column>
            <Column align="right">
              <Text style={cell}>
                {name === "Shipping" && Number(value ?? 0) === 0 ? "Free" : formatMoney(value, currency)}
              </Text>
            </Column>
          </Row>
        ))}
        <Row>
          <Column>
            <Text style={{ ...cell, fontWeight: 700, paddingTop: "6px" }}>Total</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...cell, fontWeight: 700, paddingTop: "6px" }}>
              {formatMoney(order.total, currency)}
            </Text>
          </Column>
        </Row>
      </Section>
      {order.shipping_address ? (
        <Section style={{ marginTop: "24px" }}>
          <Text style={styles.eyebrow}>Shipping to</Text>
          {addressLines(order.shipping_address).map((line) => (
            <Text key={line} style={cell}>
              {line}
            </Text>
          ))}
          {order.shipping_methods?.[0]?.name ? (
            <Text style={{ ...label, marginTop: "6px" }}>
              Method: {order.shipping_methods[0].name}
            </Text>
          ) : null}
        </Section>
      ) : null}
    </>
  )
}

export const previewOrder: EmailOrder = {
  id: "order_preview",
  display_id: 1042,
  email: "researcher@example.com",
  currency_code: "usd",
  item_total: 228,
  shipping_total: 0,
  tax_total: 0,
  discount_total: 0,
  total: 228,
  items: [
    {
      id: "item_1",
      product_title: "Peptide Series 01",
      variant_title: "10 mg",
      quantity: 2,
      unit_price: 89,
      total: 178,
    },
    {
      id: "item_2",
      product_title: "Bacteriostatic Water",
      variant_title: "30 ml",
      quantity: 1,
      unit_price: 50,
      total: 50,
    },
  ],
  shipping_address: {
    first_name: "Ada",
    last_name: "Lovelace",
    company: "Northfield Research Lab",
    address_1: "100 Science Park",
    city: "Boston",
    province: "MA",
    postal_code: "02110",
    country_code: "us",
  },
  shipping_methods: [{ name: "Standard Shipping" }],
}
