import { BOOK, stripe } from "../lib/book"

/** Run with medusa exec after deploying the cover to the public storefront. */
export default async function updateBookListing() {
  await stripe().products.update(BOOK.stripeProduct, {
    name: BOOK.name,
    description: BOOK.description,
    images: ["https://www.vetud.com/images/book/peptides-the-complete-guide.jpg"],
  })
}
