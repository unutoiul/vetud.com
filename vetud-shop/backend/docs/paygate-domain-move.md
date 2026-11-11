# PayGate on pep.company

The shop is `https://www.pep.company`; education remains `https://www.vetud.com`.

- On both Railway backend services, set `STOREFRONT_URL=https://www.pep.company` and include `https://pep.company` and `https://www.pep.company` in `STORE_CORS` and `AUTH_CORS`.
- Set the Vercel shop production `NEXT_PUBLIC_BASE_URL=https://www.pep.company`.
- Keep `MEDUSA_BACKEND_URL` pointing at the Medusa backend. PayGate signs callbacks to `${MEDUSA_BACKEND_URL}/paygate/callback`; the shop-domain move does not change that endpoint.
- Keep the existing `PAYGATE_CALLBACK_SECRET` and payout wallets. Rotating them breaks existing payment verification.
- The dedicated `PAYGATE_API_DOMAIN` works independently of the shop hostname. Keep `PAYGATE_CHECKOUT_DOMAIN=checkout.paygate.to` unless a custom domain has been provisioned and verified.
- `PAYGATE_ENABLED=true` enables configured modes. The restore migration adds those providers to existing regions, preserving other payment methods. For a later configuration change run `npx medusa exec ./src/scripts/enable-paygate.ts`.

Checkout first reserves an order, then follows a signed backend link to the hosted invoice. The backend checks the invoice, order total, currency and payment collection. Paid, canceled, modified or review-needed invoices cannot be reopened. Customers can resume an unpaid invoice from their authenticated order history. No redirect marks an order paid: only verified settlement can capture payment and release fulfillment.

PayGate's SDK does not supply a merchant return-URL option. Customers can return to their account to check the verified order status. Do not add undocumented return parameters or treat a browser return as payment confirmation.
