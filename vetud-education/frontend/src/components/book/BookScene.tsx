import Box from "@mui/material/Box"
import Image from "next/image"
import { BOOK } from "./book"
import BookCoverZoom from "./BookCoverZoom"

export default function BookScene({ priority = false }: { priority?: boolean }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "10 / 9",
        bgcolor: "brand.teal850",
        "@media (max-width:759px)": { aspectRatio: "3 / 2" },
      }}
    >
      <Image
        src="/images/book/peptides-guide-in-the-lab.webp"
        alt={BOOK.title}
        fill
        sizes="(max-width: 759px) 100vw, (min-width: 1200px) 560px, (min-width: 900px) 48vw, 560px"
        preload={priority}
        style={{ objectFit: "cover", objectPosition: "center" }}
      />
      <BookCoverZoom />
    </Box>
  )
}
