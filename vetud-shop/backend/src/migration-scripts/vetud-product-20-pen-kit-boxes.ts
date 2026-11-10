import type { ExecArgs } from "@medusajs/framework/types"
import addPenKitBoxes from "../scripts/add-pen-kit-boxes"

/**
 * Runs once during deploy: adds the Pen kit box (owner approved 2026-11-04) to every dual-chamber
 * product except bacteriostatic water, at the pen's price plus $40 / €38, and updates what the pen
 * and the box include.
 */
export default async function penKitBoxes(args: ExecArgs) {
  await addPenKitBoxes(args)
}
