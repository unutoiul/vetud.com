import Box from "@mui/material/Box"

/** Member text is plain: paragraphs and line breaks only, rendered as text (never HTML). */
export default function PostBody({ body, size = 16, color = "brand.ink" }: { body: string; size?: number; color?: string }) {
  return <Box translate="no" sx={{ fontSize: size, lineHeight: 1.75, color, overflowWrap: "anywhere", "& p": { m: 0, whiteSpace: "pre-wrap" }, "& p + p": { mt: 1.75 } }}>
    {body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
  </Box>
}
