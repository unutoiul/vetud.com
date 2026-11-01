import Box from "@mui/material/Box"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"

/** Numbered references under an article or profile, each opening the original source. */
export default function SourceList({ sources }: { sources: { title?: string; label?: string; detail: string; url: string }[] }) {
  return (
    <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5 }}>
      {sources.map((source) => (
        <Box component="li" key={source.url} sx={{ color: "text.secondary", fontSize: 14, lineHeight: 1.6, "&::marker": { fontVariantNumeric: "tabular-nums" } }}>
          <Link href={source.url} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{source.title ?? source.label}</Link>
          <Typography component="span" sx={{ display: "block", fontSize: 13, color: "text.secondary" }}>{source.detail}</Typography>
        </Box>
      ))}
    </Box>
  )
}

export const LEARN_DISCLAIMER = "VETUD Learn explains published research in plain language. It is general information, not medical advice. Talk to a doctor before starting, stopping or changing any treatment."
