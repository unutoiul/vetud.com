import { Section, Text } from "@react-email/components"
import { EmailLayout, styles } from "./_lib/layout"
import type { ContactMessageEmailData } from "./_lib/types"

export const contactMessageSubject = ({ name, subject }: ContactMessageEmailData) =>
  `Contact form: ${subject || "New message"} (${name})`

export default function ContactMessageEmail({
  name,
  email,
  subject,
  order_number,
  message,
}: ContactMessageEmailData) {
  return (
    <EmailLayout preview={`${name} sent a message through the contact form.`}>
      <Text style={styles.eyebrow}>Contact form</Text>
      <Text style={styles.heading}>{subject || "New message"}</Text>
      <Text style={styles.text}>
        From <strong>{name}</strong> ({email})
        {order_number ? ` · Order ${order_number}` : ""}
      </Text>
      <Section style={styles.panel}>
        <Text style={{ ...styles.text, margin: 0, whiteSpace: "pre-line" }}>{message}</Text>
      </Section>
      <Text style={styles.muted}>Reply to this email to answer the customer directly.</Text>
    </EmailLayout>
  )
}

ContactMessageEmail.PreviewProps = {
  name: "Ada Lovelace",
  email: "researcher@example.com",
  subject: "Documentation request",
  order_number: "#1042",
  message: "Could you send the COA for lot VTD01-2609A?\n\nThank you.",
} satisfies ContactMessageEmailData
