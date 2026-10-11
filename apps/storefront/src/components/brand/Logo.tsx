import Box from "@mui/material/Box"
import { brand, fonts } from "@/theme/tokens"

type LogoProps = {
  tone?: "dark" | "light"
}

/** The Vetud hex-sequence mark with the stacked wordmark from the concept. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Box
      component="span"
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.3)}px`,
        border: "1px solid #9bcac1",
        background: "linear-gradient(145deg,#f9fffc,#e3f1eb)",
        boxShadow: "0 3px 10px rgba(19,73,76,.08)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.83} height={size * 0.83} aria-hidden="true">
        <path
          d="M20 4.8 31.2 11.2v12.9L20 30.5 8.8 24.1V11.2Z"
          fill="none"
          stroke="#54b9ad"
          strokeWidth="1.25"
        />
        <path
          d="M14.4 13.2 20 26.8l5.6-13.6M11 20h18M20 5v25.5"
          fill="none"
          stroke="#3e7394"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <circle cx="20" cy="5" r="2" fill="#55c8b7" />
        <circle cx="11" cy="20" r="1.8" fill="#6fbec1" />
        <circle cx="29" cy="20" r="1.8" fill="#6fbec1" />
        <circle cx="20" cy="30" r="2" fill="#55c8b7" />
      </svg>
    </Box>
  )
}

export default function Logo({ tone = "dark" }: LogoProps) {
  const light = tone === "light"
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      <LogoMark />
      <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: "3px", lineHeight: 1 }}>
        <Box
          component="strong"
          sx={{
            fontSize: 17,
            letterSpacing: "0.13em",
            fontWeight: 800,
            color: light ? "#f3fbf7" : "#123b50",
          }}
        >
          VETUD
        </Box>
        <Box
          component="small"
          sx={{
            fontFamily: fonts.mono,
            fontSize: 9,
            letterSpacing: "0.22em",
            color: light ? "#82c7bc" : brand.muted,
          }}
        >
          PEPTIDES
        </Box>
      </Box>
    </Box>
  )
}
