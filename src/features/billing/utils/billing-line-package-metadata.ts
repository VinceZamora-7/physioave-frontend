import type {BillingLineItem} from "@/features/billing/api/billing-phase1.service"

export type SelectedBillingLinePackageMetadata = {
  id: number | string
  packageId?: number | string
  bundleTemplateId?: number | string
  bundleQty?: number
  bundleItems?: NonNullable<BillingLineItem["bundle_items"]>
  packageConfig?: unknown
}

export const parseBillingLinePackageMetadata = (
  line: BillingLineItem
): Omit<SelectedBillingLinePackageMetadata, "id"> => ({
  packageId: line.package_id,
  bundleTemplateId: line.bundle_template_id ?? line.bundle_id,
  bundleQty: line.bundle_qty,
  bundleItems: Array.isArray(line.bundle_items) ? line.bundle_items.map(item => ({ ...item })) : undefined,
  packageConfig: line.package_config
})

export const billingLinePackageMetadataAsPayload = (
  line: SelectedBillingLinePackageMetadata
): Pick<BillingLineItem, "package_id" | "bundle_template_id" | "bundle_id" | "bundle_qty" | "bundle_items" | "package_config"> => ({
  package_id: line.packageId ?? line.id,
  bundle_template_id: line.bundleTemplateId,
  bundle_id: line.bundleTemplateId,
  bundle_qty: line.bundleQty,
  bundle_items: line.bundleItems?.map(bundleItem => ({
    id: bundleItem.id,
    qty: Math.max(1, Number(bundleItem.qty ?? 1))
  })),
  package_config: line.packageConfig
})
