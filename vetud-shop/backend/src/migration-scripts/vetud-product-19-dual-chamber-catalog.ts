import type { ExecArgs } from "@medusajs/framework/types"
import importDualChamberCatalog from "../scripts/import-dual-chamber-catalog"

/**
 * Runs once during deploy: publishes the 28 dual-chamber pen and vial products (owner approved
 * 2026-11-04). Earlier pen kits and nasal sprays on the same handles move to draft as
 * `<handle>-pen-kit-2026`, and the unspecified Melanotan kit goes back to draft. The storefront
 * artwork may go live after this (its build needs this backend), so missing images only warn.
 */
export default async function dualChamberCatalog(args: ExecArgs) {
  await importDualChamberCatalog(args, { requireImages: false })
}
