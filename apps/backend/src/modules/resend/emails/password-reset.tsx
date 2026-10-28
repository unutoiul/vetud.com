import { Button, Section, Text } from "@react-email/components"
import { EmailLayout, styles } from "./_lib/layout"
import type { PasswordResetEmailData } from "./_lib/types"

export const passwordResetSubject = () => "Reset your VETUD password"

export default function PasswordResetEmail({ reset_url }: PasswordResetEmailData) {
  return (
    <EmailLayout preview="Use this link to choose a new password. It expires in 15 minutes.">
      <Text style={styles.eyebrow}>Account</Text>
      <Text style={styles.heading}>Choose a new password.</Text>
      <Text style={styles.text}>
        We received a request to reset the password for your VETUD account. The link works once and
        expires in 15 minutes.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <Button href={reset_url} style={styles.button}>
          Reset password
        </Button>
      </Section>
      <Text style={styles.muted}>
        If you didn&apos;t ask for this, you can ignore this email. Your password stays the same.
      </Text>
    </EmailLayout>
  )
}

PasswordResetEmail.PreviewProps = {
  reset_url: "http://localhost:8000/us/account/reset-password?token=preview&email=researcher%40example.com",
} satisfies PasswordResetEmailData
