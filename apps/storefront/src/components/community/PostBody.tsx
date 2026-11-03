import Box from "@mui/material/Box"

/** Member text is plain: paragraphs and line breaks only, rendered as text (never HTML). */
export default function PostBody({ body, size = 16 }: { body: string; size?: number }) {
  return <Box sx={{ fontSize: size, lineHeight: 1.75, color: "brand.ink", overflowWrap: "anywhere", "& p": { m: 0, whiteSpace: "pre-wrap" }, "& p + p": { mt: 1.75 } }}>
    {body.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
  </Box>
}
