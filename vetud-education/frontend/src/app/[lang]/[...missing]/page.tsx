import { notFound } from "next/navigation"

/** Unknown addresses, so they get this site's own 404 page inside its layout. */
export default function MissingPage() {
  notFound()
}
