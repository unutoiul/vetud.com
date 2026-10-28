export type EmailAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
}

export type EmailLineItem = {
  id: string
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity: number | string
  unit_price?: number | string | null
  total?: number | string | null
}

export type EmailOrder = {
  id: string
  display_id?: number | string | null
  email?: string | null
  currency_code: string
  created_at?: string | Date | null
  item_total?: number | string | null
  shipping_total?: number | string | null
  tax_total?: number | string | null
  discount_total?: number | string | null
  total?: number | string | null
  items?: EmailLineItem[] | null
  shipping_address?: EmailAddress | null
  shipping_methods?: { name?: string | null }[] | null
}

export type OrderPlacedEmailData = {
  order: EmailOrder
  storefront_url: string
  payment_instructions?: string
  bank_details?: string
  manual_payment?: boolean
  payment_summary?: string
  admin_payment_action?: string
}

export type ShipmentCreatedEmailData = {
  order: EmailOrder
  storefront_url: string
  tracking: { tracking_number?: string | null; tracking_url?: string | null }[]
}

export type PasswordResetEmailData = {
  reset_url: string
}

export type ContactMessageEmailData = {
  name: string
  email: string
  subject?: string | null
  order_number?: string | null
  message: string
}
