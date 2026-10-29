import path from "node:path"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { processPaymentWorkflow } from "@medusajs/medusa/core-flows"
import { CardApi } from "paygate-to"
import { PAYGATE_CARD } from "../../src/lib/paygate-config"
import { findPaygateCapture, readPaygate, sealPaygate } from "../../src/lib/paygate-state"

jest.setTimeout(240000)

medusaIntegrationTestRunner({
  cwd: path.resolve(process.cwd(), "integration-tests/paygate"),
  dbName: `vetud_paygate_test_${process.pid}`,
  testSuite: ({ getContainer, dbConfig }) => {
    beforeAll(() => {
      expect(new URL(dbConfig.clientUrl).hostname).toBe("localhost")
      jest.spyOn(CardApi.prototype, "convertToUsd").mockResolvedValue({ value: "100", exchangeRate: "1" })
      jest.spyOn(CardApi.prototype, "providers").mockResolvedValue([{ id: "test", name: "Test", active: true, status: "active", minimumAmount: "1", minimumCurrency: "USD" }])
      jest.mocked(CardApi.prototype.convertToUsd).mockImplementation(async amount => ({ value: String(amount), exchangeRate: "1" }))
      jest.spyOn(CardApi.prototype, "createWallet").mockImplementation(async (_address, callbackUrl) => ({ addressIn: "test%2Fwallet", polygonAddressIn: `0x${"2".repeat(40)}`, callbackUrl, ipnToken: "test", raw: {} }))
    })
    afterAll(() => jest.restoreAllMocks())

    it("defers unpaid authorization and records exactly one native Medusa capture after verified settlement", async () => {
      const container = getContainer()
      const payments = container.resolve(Modules.PAYMENT)
      const collection = await payments.createPaymentCollections({ amount: 100, currency_code: "usd" })
      const session = await payments.createPaymentSession(collection.id, {
        amount: 100, currency_code: "usd", provider_id: PAYGATE_CARD, data: { cart_id: "cart_test", email: "buyer@example.com" },
      })
      await expect(payments.authorizePaymentSession(session.id, {})).resolves.toBeNull()
      expect((await payments.retrievePaymentSession(session.id)).status).toBe("pending_authorization")
      expect(await payments.listPayments({ payment_session_id: session.id })).toHaveLength(0)
      const state = readPaygate(session.data, "a".repeat(64))
      expect(state.session_id).toBe(session.id)
      // Simulates the already tested signature/payout reconciliation boundary.
      const verified = sealPaygate({ ...state, settled: true, receipts: [{ transaction: "confirmed_test_tx", coin: "polygon_usdc", received: "100", usd: "100", payout: "99" }] }, "a".repeat(64))
      await payments.updatePaymentSession({ id: session.id, amount: 100, currency_code: "usd", status: "pending_authorization", data: { paygate: verified } })
      await processPaymentWorkflow(container).run({ input: { action: "captured", data: { session_id: session.id, amount: 100 } } })
      const rows = await payments.listPayments({ payment_session_id: session.id }, { relations: ["captures", "payment_session", "refunds"] })
      expect(rows).toHaveLength(1)
      expect(rows[0].captured_at).toBeTruthy()
      expect(rows[0].captures).toHaveLength(1)
      expect(Number(rows[0].amount)).toBe(100)
      expect(findPaygateCapture(verified, rows)?.id).toBe(rows[0].id)
      await processPaymentWorkflow(container).run({ input: { action: "captured", data: { session_id: session.id, amount: 100 } } })
      expect((await payments.listPayments({ payment_session_id: session.id }, { relations: ["captures"] }))[0].captures).toHaveLength(1)
      expect((await payments.retrievePaymentSession(session.id)).status).toBe("authorized")
    })
  },
})
