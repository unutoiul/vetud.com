import Box from "@mui/material/Box"
import { brand } from "@/theme/tokens"

/** Alpine peaks form an open V; three terminals echo a molecular bond. */
export function LogoMark({ size = 44, tone = "dark" }: { size?: number; tone?: "dark" | "light" }) {
  return <svg viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" style={{ flexShrink: 0, display: "block" }}>
    <path d="m6 9 18 31L42 9" stroke={tone === "light" ? "#f5f9fb" : brand.navy} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m11 29 10-17 9 15 7-12" stroke={tone === "light" ? "#a5c6b5" : brand.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="9" r="3" fill={tone === "light" ? "#a5c6b5" : brand.teal} />
    <circle cx="21" cy="12" r="2.6" fill={tone === "light" ? "#f5f9fb" : brand.navy} />
    <circle cx="42" cy="9" r="3" fill={tone === "light" ? "#a5c6b5" : brand.blue} />
  </svg>
}

export default function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return <Box component="span" translate="no" sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
    <LogoMark tone={tone} />
    <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: "5px", lineHeight: 1 }}>
      <Box component="strong" sx={{ fontSize: 23, letterSpacing: ".19em", fontWeight: 650, color: tone === "light" ? brand.onNavy : brand.navy }}>VETUD</Box>
      <Box component="small" sx={{ fontSize: 9, letterSpacing: ".32em", color: tone === "light" ? brand.onNavyMuted : brand.muted }}>PEPTIDE SCIENCE</Box>
    </Box>
  </Box>
}
