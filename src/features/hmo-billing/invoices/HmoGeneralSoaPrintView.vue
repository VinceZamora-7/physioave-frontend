<template>
  <HmoInvoiceLayout
    title="STATEMENT OF ACCOUNT"
    :subtitle="`Statement for ${partnerLabel}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Transaction Period:</strong><span>{{ periodLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-else #details>
      <div class="details-grid">
        <div class="details-group">
          <div class="line">
            <span class="label">Partner Institution:</span>
            <span>{{ partnerLabel }}</span>
          </div>

          <div class="line">
            <span class="label">Billing Date:</span>
            <span>{{ billingDateLabel }}</span>
          </div>
        </div>

        <div class="details-group">
          <div class="line">
            <span class="label">Transaction Period:</span>
            <span>{{ periodLabel }}</span>
          </div>

          <div class="line">
            <span class="label">Patient Count:</span>
            <span>{{ patientCount }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap hmo-soa-table-wrap">
        <table class="soa-table hmo-soa-table">
          <thead>
            <tr>
              <th class="col-item text-center">ITEM No.</th>
              <th class="col-patient text-center">PATIENT NAME</th>
              <th class="col-reference text-center">REFERENCE NO.</th>
              <th class="col-status text-center">LOA Approval No.</th>
              <th class="col-date text-center">LOA DATE ISSUED</th>
              <th class="col-service text-center">PT SERVICE RENDERED</th>
              <th class="col-qty text-center">INVOICE BILLING TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="row in rows" :key="row.key">
              <tr v-if="row.kind === 'service'">
                <td class="text-center">{{ row.itemNo }}</td>
                <td class="text-center">{{ row.patientName }}</td>
                <td class="text-center">{{ row.referenceNo }}</td>
                <td class="text-center">{{ row.loaApprovalNo }}</td>
                <td class="text-center">{{ formatDate(row.loaDateIssued) }}</td>
                <td>{{ row.serviceName }}</td>
                <td class="text-center">{{ formatPrice(row.unitPrice) }}</td>
              </tr>

              <tr v-else class="patient-total-row">
                <td colspan="7" class="text-right">
                  Patient Billing Total: {{ asCurrency(row.total) }}
                </td>
              </tr>
            </template>
          </tbody>

          <tfoot>
            <tr class="grand-total-row">
              <td colspan="7" class="text-right">
                GRAND TOTAL: {{ asCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div class="approval-wrap hmo-soa-bottom">
        <section class="payment-box">
          <h3>HMO DETAILS</h3>
          <div><strong>Partner Institution:</strong> {{ partnerLabel }}</div>
          <div><strong>Billing Date:</strong> {{ billingDateLabel }}</div>
          <div><strong>Transaction Period:</strong> {{ periodLabel }}</div>
        </section>

        <section class="approval-card">
          <div class="approval-label">
            Approved by:
          </div>

          <div class="approval-name">
            RENALOU B. CORDOVA, PTRP, UK-PT
          </div>

          <div class="approval-line"></div>

          <div class="approval-title">
            Chief Operations Officer
          </div>

          <div class="approval-signed">
            Date Signed: {{ dateSigned }}
          </div>
        </section>
      </div>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import {
  billingPhase1Service,
  type BillingListItem,
  type HmoRecentHistoryItem
} from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { formatHmoStatus, useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type ServiceHmoSoaRow = {
  kind: "service"
  key: string
  itemNo: number | null
  patientName: string
  referenceNo: string
  loaApprovalNo: string
  loaDateIssued: string | null
  billingStatus: string
  treatmentDate: string | null
  serviceName: string
  quantity: number
  laterality: string
  bodyArea: string
  unitPrice: number
  unitTotal: number
}

type PatientTotalRow = {
  kind: "patientTotal"
  key: string
  total: number
}

type SoaDisplayRow = ServiceHmoSoaRow | PatientTotalRow

type HmoSoaLineItem = {
  id?: number | string
  name?: string
  quantity?: number | string
  price?: number | string
  unitPrice?: number | string
  unit_price?: number | string
  laterality?: string
  laterality_name?: string
  body_area?: string
  bodyArea?: string
}

type HmoSoaHistoryItem = HmoRecentHistoryItem &
  Pick<
    BillingListItem,
    | "public_id"
    | "line_items_json"
    | "diagnosis"
    | "hmo_loa_number"
    | "hmo_loa_date"
    | "loa_date"
    | "hmo_approval_code"
  > & {
    receipt_number?: string | null
  }

type HmoSoaSourceItem = HmoSoaHistoryItem

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useHmoInvoicePrintActions()

const rows = ref<SoaDisplayRow[]>([])
const error = ref("")

const dateSigned = computed(() => new Date().toLocaleDateString("en-PH"))
const dateFrom = computed(() => String(route.query.from ?? "").trim())
const dateTo = computed(() => String(route.query.to ?? "").trim())
const hmoName = computed(() => String(route.query.hmo_name ?? "").trim())

const hmoId = computed(() => {
  const parsed = Number(String(route.query.hmo_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
})

const partnerLabel = computed(() => hmoName.value || "HMO")

const billingDateLabel = computed(() => {
  const endDate = dateTo.value ? new Date(dateTo.value) : null
  if (!endDate || Number.isNaN(endDate.getTime())) {
    return new Date().toLocaleDateString("en-PH")
  }

  return endDate.toLocaleDateString("en-PH")
})

const periodLabel = computed(() => {
  if (!dateFrom.value && !dateTo.value) return "-"

  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value)} to ${formatDate(dateTo.value)}`
  }

  return formatDate(dateFrom.value || dateTo.value)
})

const patientCount = computed(() =>
  rows.value.filter(row => row.kind === "patientTotal").length
)

const grandTotal = computed(() =>
  rows.value.reduce((sum, row) => {
    return sum + (row.kind === "service" ? Number(row.unitTotal ?? 0) : 0)
  }, 0)
)

const formatDate = (value?: string | null): string => {
  if (!value) return "-"

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const asCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP"
  })

const formatPrice = (value?: number | null): string => {
  if (value === null || value === undefined) return "-"
  return Number(value) > 0 ? asCurrency(value) : "FREE"
}

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

const getBillingRecordId = (billing: Pick<HmoSoaSourceItem, "id" | "public_id">): string =>
  firstNonBlank(billing.public_id, `BILLING-${billing.id}`)

const getLoaApprovalNo = (billing: HmoSoaSourceItem): string => {
  return String(
    billing.hmo_approval_code ??
    billing.hmo_loa_number ??
    billing.receipt_number ??
    getBillingRecordId(billing)
  ).trim() || "N/A"
}

const getLoaDateIssued = (billing: HmoSoaSourceItem): string | null =>
  firstNonBlank(billing.hmo_loa_date, billing.loa_date) || null

const parseLineItems = (billing: HmoSoaSourceItem): HmoSoaLineItem[] => {
  try {
    const parsed = JSON.parse(billing.line_items_json || "[]") as unknown

    return Array.isArray(parsed)
      ? parsed.filter(item => item && typeof item === "object") as HmoSoaLineItem[]
      : []
  } catch {
    return []
  }
}

const parseSummaryMarker = (value?: string | null): { laterality: string; bodyArea: string } => {
  const text = String(value ?? "").trim()

  if (!text) {
    return {
      laterality: "N/A",
      bodyArea: "N/A"
    }
  }

  const markerMatch = text.match(/^\(?\s*(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)?[\s,:-]*(.*)$/i)

  if (markerMatch) {
    const marker = markerMatch[1].toUpperCase()

    return {
      laterality:
        marker === "L" || marker === "LEFT"
          ? "Left"
          : marker === "R" || marker === "RIGHT"
            ? "Right"
            : "Both",
      bodyArea: markerMatch[2]?.trim() || "N/A"
    }
  }

  const wordMatch = text.match(/^(LEFT|RIGHT|BOTH|BILATERAL)\b[\s,;:-]*(.*)$/i)

  if (wordMatch) {
    const marker = wordMatch[1].toUpperCase()

    return {
      laterality: marker === "LEFT" ? "Left" : marker === "RIGHT" ? "Right" : "Both",
      bodyArea: wordMatch[2]?.trim() || "N/A"
    }
  }

  return {
    laterality: "N/A",
    bodyArea: text
  }
}

const normalizeBodyArea = (value?: string | null): string => {
  const text = String(value ?? "").trim()
  if (!text) return "N/A"

  const withoutParentheses = text.replace(/\s*\([^)]*\)/g, "").trim()
  if (withoutParentheses) return withoutParentheses

  const suffixMatch = text.match(/^(.*?)[\s,:-]*\(?\s*(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)?$/i)

  if (suffixMatch) {
    const bodyArea = suffixMatch[1]?.trim()
    if (bodyArea) return bodyArea
  }

  const prefixMatch = text.match(/^\(?\s*(L|R|B|LEFT|RIGHT|BOTH|BILATERAL)\s*\)?[\s,:-]*(.*)$/i)

  if (prefixMatch) {
    const bodyArea = prefixMatch[2]?.trim()
    if (bodyArea) return bodyArea
  }

  return text
}

const resolveLaterality = (lineItem: HmoSoaLineItem, billing: HmoSoaSourceItem): string => {
  const fromLineItem = String(lineItem.laterality ?? lineItem.laterality_name ?? "").trim()
  if (fromLineItem) return fromLineItem

  return parseSummaryMarker(billing.diagnosis).laterality
}

const resolveBodyArea = (lineItem: HmoSoaLineItem, billing: HmoSoaSourceItem): string => {
  const fromLineItem = normalizeBodyArea(String(lineItem.body_area ?? lineItem.bodyArea ?? ""))
  if (fromLineItem !== "N/A") return fromLineItem

  return parseSummaryMarker(billing.diagnosis).bodyArea
}

const enrichHmoSoaItems = async (items: HmoRecentHistoryItem[]): Promise<HmoSoaHistoryItem[]> => {
  const detailedItems = await Promise.all(
    items.map(async item => {
      try {
        const context = item.id > 0
          ? await billingContextTanstackService.fetchContext(queryClient, item.id)
          : undefined

        const detail = context?.billing

        return detail
          ? {
              ...item,
              public_id: detail.public_id,
              line_items_json: detail.line_items_json,
              diagnosis: detail.diagnosis,
              hmo_loa_number: detail.hmo_loa_number,
              hmo_loa_date: detail.hmo_loa_date,
              loa_date: detail.loa_date,
              hmo_approval_code: detail.hmo_approval_code,
              receipt_number: detail.receipt_number
            }
          : item
      } catch {
        return item
      }
    })
  )

  return detailedItems as HmoSoaHistoryItem[]
}

const getTimestamp = (record: HmoSoaSourceItem): number => {
  const parsed = new Date(record.created_at ?? "")
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

const buildRows = (items: HmoSoaSourceItem[]): SoaDisplayRow[] => {
  const patientGroups = new Map<string, HmoSoaSourceItem[]>()

  items.forEach(item => {
    const key = String(item.patient_id ?? item.patient_name ?? "unknown").trim()
    const current = patientGroups.get(key) ?? []

    current.push(item)
    patientGroups.set(key, current)
  })

  const outputRows: SoaDisplayRow[] = []
  let itemNo = 1

  Array.from(patientGroups.entries())
    .sort(([, leftItems], [, rightItems]) => {
      return String(leftItems[0]?.patient_name ?? "").localeCompare(
        String(rightItems[0]?.patient_name ?? "")
      )
    })
    .forEach(([patientKey, patientItems]) => {
      const sortedItems = [...patientItems].sort((left, right) => {
        return getTimestamp(left) - getTimestamp(right)
      })

      let patientTotal = 0
      let lastPrintedGroupKey = ""

      const resolveDisplayFields = (
        item: HmoSoaSourceItem,
        referenceNo: string,
        loaApprovalNo: string
      ): {
        itemNo: number | null
        patientName: string
        referenceNo: string
        loaApprovalNo: string
      } => {
        const patientName = item.patient_name || "Unknown Patient"

        const currentGroupKey = [
          patientName,
          referenceNo,
          loaApprovalNo
        ].join("|")

        if (currentGroupKey === lastPrintedGroupKey) {
          return {
            itemNo: null,
            patientName: "",
            referenceNo: "",
            loaApprovalNo: ""
          }
        }

        lastPrintedGroupKey = currentGroupKey

        const displayFields = {
          itemNo,
          patientName,
          referenceNo,
          loaApprovalNo
        }

        itemNo += 1

        return displayFields
      }

      sortedItems.forEach((item, index) => {
        const lineItems = parseLineItems(item)
        const referenceNo = getBillingRecordId(item)
        const billingStatus = formatHmoStatus(item.billing_status)
        const loaApprovalNo = getLoaApprovalNo(item)

        if (!lineItems.length) {
          const unitPrice = Number(item.total_amount ?? 0)
          patientTotal += unitPrice

          const displayFields = resolveDisplayFields(item, referenceNo, loaApprovalNo)

          outputRows.push({
            kind: "service",
            key: `service-${patientKey}-${index}`,
            itemNo: displayFields.itemNo,
            patientName: displayFields.patientName,
            referenceNo: displayFields.referenceNo,
            loaApprovalNo: displayFields.loaApprovalNo,
            loaDateIssued: getLoaDateIssued(item),
            billingStatus,
            treatmentDate: item.created_at,
            serviceName: item.service_name || "HMO Service",
            quantity: 1,
            laterality: "N/A",
            bodyArea: "N/A",
            unitPrice,
            unitTotal: unitPrice
          })

          return
        }

        lineItems.forEach((lineItem, lineIndex) => {
          const quantity = Math.max(1, Number(lineItem.quantity ?? 1))
          const unitPrice = Number(lineItem.price ?? lineItem.unitPrice ?? lineItem.unit_price ?? 0)
          const unitTotal = quantity * unitPrice

          patientTotal += unitTotal

          const laterality = resolveLaterality(lineItem, item)
          const bodyArea = resolveBodyArea(lineItem, item)
          const displayFields = resolveDisplayFields(item, referenceNo, loaApprovalNo)

          outputRows.push({
            kind: "service",
            key: `service-${patientKey}-${index}-${lineIndex}`,
            itemNo: displayFields.itemNo,
            patientName: displayFields.patientName,
            referenceNo: displayFields.referenceNo,
            loaApprovalNo: displayFields.loaApprovalNo,
            loaDateIssued: getLoaDateIssued(item),
            billingStatus,
            treatmentDate: item.created_at,
            serviceName: String(lineItem.name ?? item.service_name ?? "HMO Service"),
            quantity,
            laterality,
            bodyArea,
            unitPrice,
            unitTotal
          })
        })
      })

      outputRows.push({
        kind: "patientTotal",
        key: `patient-total-${patientKey}`,
        total: patientTotal
      })
    })

  return outputRows
}

const load = async (): Promise<void> => {
  error.value = ""
  rows.value = []

  if (!dateFrom.value || !dateTo.value) {
    error.value = "Date range is required."
    return
  }

  try {
    const data = await billingPhase1Service.getHmoSoa({
      from: dateFrom.value,
      to: dateTo.value,
      limit: 5000,
      ...(hmoId.value ? { hmo_id: hmoId.value } : {})
    }) ?? []

    const detailedData = await enrichHmoSoaItems(data)
    rows.value = buildRows(detailedData as HmoSoaSourceItem[])
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load HMO SOA records"
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => printPage(), 50)
    }
  })
})
</script>

<style scoped>
@media screen {
  .hmo-soa-table {
    min-width: 980px;
  }
}

.hmo-soa-table .col-item {
  width: 7%;
}

.hmo-soa-table .col-patient {
  width: 17%;
}

.hmo-soa-table .col-reference {
  width: 15%;
}

.hmo-soa-table .col-status {
  width: 16%;
}

.hmo-soa-table .col-date {
  width: 14%;
}

.hmo-soa-table .col-service {
  width: 20%;
}

.hmo-soa-table .col-qty {
  width: 11%;
}

.hmo-soa-bottom {
  justify-content: space-between;
  align-items: flex-start;
}

@media print {
  .hmo-soa-table-wrap {
    break-inside: auto !important;
    page-break-inside: auto !important;
    overflow: visible !important;
    margin-top: 2px !important;
  }

  .hmo-soa-table {
    break-inside: auto !important;
    page-break-inside: auto !important;
    margin-top: 2px !important;
  }

  .hmo-soa-table thead {
    display: table-header-group !important;
  }

  .hmo-soa-table tfoot {
    display: table-footer-group !important;
  }

  .hmo-soa-table tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  :global(.hmo-invoice-details),
  :global(.lgu-invoice-details) {
    margin-bottom: 2px !important;
  }

  .details-grid {
    margin-bottom: 2px !important;
  }

  .hmo-soa-table .col-item {
    width: 6%;
  }

  .hmo-soa-table .col-patient {
    width: 17%;
  }

  .hmo-soa-table .col-reference {
    width: 15%;
  }

  .hmo-soa-table .col-status {
    width: 16%;
  }

  .hmo-soa-table .col-date {
    width: 14%;
  }

  .hmo-soa-table .col-service {
    width: 21%;
  }

  .hmo-soa-table .col-qty {
    width: 11%;
  }
}
</style>
