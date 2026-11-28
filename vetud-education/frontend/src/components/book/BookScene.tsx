import Box from "@mui/material/Box"
import Image from "next/image"
import { brand } from "@/theme/tokens"
import { AppLink } from "../common/links"
import BookCover from "./BookCover"

// Trace the jacket and page edges so the original artwork sits directly on the bench.
const jacket = "polygon(4.55% 3.6%, 4.95% 3.12%, 5.8% 2.83%, 7.6% 2.64%, 8% 2.93%, 92.65% 1.31%, 93.48% 1.47%, 93.85% 2.1%, 95.65% 3.23%, 96.85% 3.32%, 97.1% 3.62%, 97.1% 95.85%, 96.75% 96.17%, 94% 97.5%, 93.65% 97.86%, 92.8% 97.95%, 7.2% 97.15%, 5.5% 96.8%, 4.55% 96.42%)"

export default function BookScene({ href, alt, priority = false }: { href: string; alt: string; priority?: boolean }) {
  return (
    <Box sx={{ position: "relative", containerType: "inline-size", bgcolor: "brand.teal850", overflow: "hidden" }}>
      <Image
        src="/images/book/lab-bench.webp"
        alt=""
        fill
        sizes="(min-width: 1200px) 560px, (min-width: 760px) 48vw, 100vw"
        loading={priority ? "eager" : "lazy"}
        style={{ objectFit: "cover", objectPosition: "54% center" }}
      />
      <AppLink
        href={href}
        sx={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          height: "100%",
          boxSizing: "border-box",
          pt: "5.5cqw",
          pb: "10cqw",
          "&:focus-visible": { outline: `3px solid ${brand.white}`, outlineOffset: "-6px", boxShadow: `inset 0 0 0 7px ${brand.navyDeep}` },
          "@media (max-width:759px)": { pt: "12px", pb: "min(7cqw, 30px)" },
        }}
      >
        <BookCover
          alt={alt}
          priority={priority}
          sizes="(min-width: 1200px) 316px, (min-width: 760px) 27vw, (min-width: 420px) 176px, 42vw"
          sx={{
            position: "relative",
            width: "min(58cqw, 316px)",
            borderRadius: 0,
            boxShadow: "none",
            isolation: "isolate",
            "&::before": {
              content: '""',
              position: "absolute",
              zIndex: -1,
              left: "5%",
              right: "-9%",
              bottom: "1.2%",
              height: "3.5%",
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${brand.blue950} 10%, transparent 72%)`,
              filter: "blur(2px)",
            },
            "& img": { clipPath: jacket },
            "@media (max-width:759px)": { width: "clamp(126px, 42cqw, 176px)" },
          }}
        />
      </AppLink>
    </Box>
  )
}
