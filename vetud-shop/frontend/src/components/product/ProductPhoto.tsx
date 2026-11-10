import { useContentTranslator } from "@/i18n/use-content-translator"
import Box from "@mui/material/Box"
import Image from "next/image"

type Photo = { url: string; alt?: string; format?: string }

/**
 * A product's card photo. Products sold as a dual-chamber vial and a vial show both side by side
 * (the slim cartridge on its own reads too small in a card); others show their first photo.
 */
export default function ProductPhoto({ images, title, sizes, className, preload }: { images: Photo[]; title: string; sizes: string; className?: string; preload?: boolean }) {
  const ct = useContentTranslator()
  const pen = images.find((image) => image.format === "Dual-chamber vial")
  const vial = images.find((image) => image.format === "Vial")
  if (pen && vial) {
    return (
      <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "stretch", justifyContent: "center", gap: "2%" }}>
        {/* The cartridge photo is square with a slim cartridge in the middle: crop to it so it stands as tall as the vial. */}
        <Box sx={{ position: "relative", width: "26%", overflow: "hidden" }}>
          <Image className={className} src={pen.url} alt={ct(pen.alt ?? `${title} dual-chamber cartridge`)} fill sizes={sizes} preload={preload} draggable={false} style={{ objectFit: "cover", transition: "transform .35s ease" }} />
        </Box>
        <Box sx={{ position: "relative", width: "62%" }}>
          <Image className={className} src={vial.url} alt={ct(vial.alt ?? `${title} vial`)} fill sizes={sizes} preload={preload} draggable={false} style={{ objectFit: "contain", transition: "transform .35s ease" }} />
        </Box>
      </Box>
    )
  }
  const image = images[0]
  if (!image) return null
  return <Image className={className} src={image.url} alt={ct(image.alt ?? `${title} VETUD packaging`)} fill sizes={sizes} preload={preload} draggable={false} style={{ objectFit: "contain", transition: "transform .35s ease" }} />
}
