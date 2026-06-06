import {describe, expect, it} from "vitest"
import type {BillingLineItem} from "@/features/billing/api/billing-phase1.service"
import {
  billingLinePackageMetadataAsPayload,
  parseBillingLinePackageMetadata
} from "@/features/billing/utils/billing-line-package-metadata"

describe("billing line package metadata", () => {
  it("round-trips package metadata from saved line_items_json through selected lines to payload", () => {
    const packageConfig = {
      package_id: 42,
      package_name: "Post-op Recovery Package",
      bundle_template_id: "bundle-template-7",
      bundle_qty: 3,
      bundle_items: [{id: 101, qty: 2}]
    }
    const savedLineItemsJson = JSON.stringify([
      {
        id: 42,
        type: "package",
        name: "Post-op Recovery Package",
        price: 4500,
        quantity: 1,
        package_id: 42,
        bundle_template_id: "bundle-template-7",
        bundle_id: "bundle-instance-9",
        bundle_qty: 3,
        bundle_items: [
          {id: 101, qty: 2},
          {id: "machine-8", qty: 1}
        ],
        package_config: packageConfig
      }
    ] satisfies BillingLineItem[])

    const parsedLines = JSON.parse(savedLineItemsJson) as BillingLineItem[]
    const selectedPackageLine = {
      id: parsedLines[0].id,
      ...parseBillingLinePackageMetadata(parsedLines[0])
    }
    const payloadPackageMetadata = billingLinePackageMetadataAsPayload(selectedPackageLine)

    expect(payloadPackageMetadata).toEqual({
      package_id: 42,
      bundle_template_id: "bundle-template-7",
      bundle_id: "bundle-template-7",
      bundle_qty: 3,
      bundle_items: [
        {id: 101, qty: 2},
        {id: "machine-8", qty: 1}
      ],
      package_config: packageConfig
    })
  })
})
