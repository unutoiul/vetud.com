import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useUpdateProduct } from "@medusajs/dashboard/hooks"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Container, Heading, Label, Switch, Text, toast } from "@medusajs/ui"

const flags = [
  { key: "very_popular", label: "Very popular" },
  { key: "best_seller", label: "Best seller" },
] as const

const ProductMerchandising = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const { mutate, isPending } = useUpdateProduct(product.id)
  return <Container className="divide-y p-0">
    <div className="px-6 py-4">
      <Heading level="h2">Storefront badges</Heading>
      <Text size="small" className="text-ui-fg-subtle mt-1">Choose either label or both. These are manual selections, not calculated sales rankings.</Text>
    </div>
    <div className="flex flex-wrap gap-6 px-6 py-4">
      {flags.map(({ key, label }) => <div key={key} className="flex items-center gap-2">
        <Switch id={`${product.id}-${key}`} disabled={isPending}
          checked={product.metadata?.[key] === true || product.metadata?.[key] === "true"}
          onCheckedChange={checked => mutate({ metadata: { [key]: checked } }, {
            onSuccess: () => toast.success(`${label} ${checked ? "enabled" : "removed"}`, { description: "The storefront refreshes within a few minutes." }),
            onError: error => toast.error("Couldn't update the badge", { description: error.message }),
          })} />
        <Label htmlFor={`${product.id}-${key}`}>{label}</Label>
      </div>)}
    </div>
  </Container>
}

export const config = defineWidgetConfig({ zone: "product.details.before" })
export default ProductMerchandising
