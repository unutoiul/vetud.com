import Box from "@mui/material/Box"
import { brand } from "@/theme/tokens"

/**
 * A small country flag, served from public/flags (country-flag-icons, MIT; see LICENSE.txt there).
 * Images rather than flag emoji, which Windows shows as two letters. Decorative: the country's name
 * or calling code always sits next to it.
 */
export default function CountryFlag({ code, width = 20 }: { code: string; width?: number }) {
  const height = Math.round((width * 2) / 3)
  return <Box component="img" src={`/flags/${code.toLowerCase()}.svg`} alt="" aria-hidden width={width} height={height} loading="lazy" decoding="async"
    sx={{ display: "inline-block", flexShrink: 0, width, height, objectFit: "cover", borderRadius: "2px", boxShadow: `0 0 0 1px ${brand.navyA14}`, verticalAlign: "middle" }} />
}
