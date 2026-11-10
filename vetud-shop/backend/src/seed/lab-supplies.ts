/**
 * Lab supplies sold next to the dual-chamber catalog (owner request 2026-11-04). Photos live in the
 * storefront at /images/products/<handle>-box.webp and -single.webp; prices are retail USD;
 * other currencies are converted from it.
 */
export const LAB_SUPPLIES_REVISION = "lab-supplies-2026-11-04-v1"
export const LAB_SUPPLY_IMAGE_ORIGIN = process.env.DUAL_CHAMBER_IMAGE_ORIGIN || "https://www.vetud.com"

export const LAB_SUPPLIES = [
  {
    handle: "u-100-syringes",
    title: "U-100 Insulin Syringes",
    code: "VTD-SYR",
    category: "lab-supplies",
    subtitle: "Sterile, single-use U-100 insulin syringes, 10 to a box.",
    description: "Sterile, single-use U-100 insulin syringes with a fixed needle and an orange needle cap. The barrel is marked in units for U-100 solutions (100 units per ml). Packed 10 to a VETUD box.\n\nFor laboratory use. Each syringe is for one use only; dispose of it in a sharps container.",
    contents: "10 sterile, single-use U-100 insulin syringes in a VETUD box",
    images: ["box", "single"],
    variants: [{ title: "Box of 10", sku: "VTD-SYR-U100-10", usd: 15 }],
  },
] as const
