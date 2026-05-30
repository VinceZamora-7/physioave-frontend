<template>
  <HmoInvoiceLayout
    title="STATEMENT OF ACCOUNT"
    :subtitle="`HMO statement for ${partnerLabel}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>Partner Institution:</strong><span>{{ partnerLabel }}</span>
      <strong>Billing Date:</strong><span>{{ billingDateLabel }}</span>
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
      <div class="table-wrap">
        <table class="soa-table">
          <thead>
            <tr>
              <th class="col-item text-center">ITEM No.</th>
              <th class="col-patient">PATIENT NAME</th>
              <th class="col-reference">REFERENCE NO.</th>
              <th class="col-status">BILLING STATUS</th>
              <th class="col-date text-center">TREATMENT DATE</th>
              <th class="col-service">HMO SERVICE RENDERED</th>
              <th class="col-total text-right">INVOICE BILLING TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <template v-for="row in rows" :key="row.key">
              <tr v-if="row.kind === 'service'">
                <td class="text-center">{{ row.itemNo ?? "" }}</td>
                <td>{{ row.patientName }}</td>
                <td>{{ row.referenceNo }}</td>
                <td>{{ row.billingStatus }}</td>
                <td class="text-center">{{ formatDate(row.treatmentDate) }}</td>
                <td>{{ row.serviceName }}</td>
                <td class="text-right">{{ formatPrice(row.price) }}</td>
              </tr>

              <tr v-else class="patient-total-row">
                <td colspan="6" class="text-right">
                  Patient Billing Summary Total:
                </td>
                <td class="text-right">
                  {{ asCurrency(row.total) }}
                </td>
              </tr>
            </template>
          </tbody>

          <tfoot>
            <tr class="grand-total-row">
              <td colspan="6" class="text-right">
                GRAND TOTAL:
              </td>
              <td class="text-right">
                {{ asCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <section class="payment-box">
        <h3>HMO DETAILS</h3>

        <div><strong>Partner Institution:</strong> {{ partnerLabel }}</div>
        <div><strong>Billing Date:</strong> {{ billingDateLabel }}</div>
        <div><strong>Transaction Period:</strong> {{ periodLabel }}</div>
      </section>

      <section class="approval">
        <div><strong>Approved By:</strong></div>

        <div class="name">
          RENALOU B. CORDOVA, PTRP, UK-PT
        </div>

        <div class="title">
          Chief Operations Officer
        </div>

        <div class="signed">
          <strong>Date Signed:</strong> {{ dateSigned }}
        </div>
      </section>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import Button from "primevue/button"
import { billingPhase1Service, type HmoRecentHistoryItem } from "@/features/billing/api/billing-phase1.service"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { formatHmoStatus, useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type ServiceHmoSoaRow = {
  kind: "service"
  key: string
  itemNo: number | null
  patientName: string
  referenceNo: string
  billingStatus: string
  treatmentDate: string | null
  serviceName: string
  price: number | null
}

type PatientTotalRow = {
  kind: "patientTotal"
  key: string
  total: number
}

type SoaDisplayRow = ServiceHmoSoaRow | PatientTotalRow

const route = useRoute()
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
  if (!endDate || Number.isNaN(endDate.getTime())) return new Date().toLocaleDateString("en-PH")
  return endDate.toLocaleDateString("en-PH")
})

const periodLabel = computed(() => {
  if (!dateFrom.value && !dateTo.value) return "-"
  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value)} to ${formatDate(dateTo.value)}`
  }
  return formatDate(dateFrom.value || dateTo.value)
})

const patientCount = computed(() => rows.value.filter(row => row.kind === "patientTotal").length)
const grandTotal = computed(() => rows.value.reduce((sum, row) => {
  return sum + (row.kind === "service" ? Number(row.price ?? 0) : 0)
}, 0))

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const asCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatPrice = (value?: number | null): string => {
  if (value === null || value === undefined) return "-"
  return Number(value) > 0 ? asCurrency(value) : "FREE"
}

const getTimestamp = (record: HmoRecentHistoryItem): number => {
  const parsed = new Date(record.created_at ?? "")
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
}

const buildRows = (items: HmoRecentHistoryItem[]): SoaDisplayRow[] => {
  const patientGroups = new Map<string, HmoRecentHistoryItem[]>()

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
      return String(leftItems[0]?.patient_name ?? "").localeCompare(String(rightItems[0]?.patient_name ?? ""))
    })
    .forEach(([patientKey, patientItems]) => {
      const sortedItems = [...patientItems].sort((left, right) => getTimestamp(left) - getTimestamp(right))
      let patientTotal = 0
      let isFirstRow = true

      sortedItems.forEach((item, index) => {
        const price = Number(item.total_amount ?? 0)
        patientTotal += price

        outputRows.push({
          kind: "service",
          key: `service-${patientKey}-${index}`,
          itemNo: isFirstRow ? itemNo : null,
          patientName: isFirstRow ? (item.patient_name || "Unknown Patient") : "",
          referenceNo: isFirstRow ? (item.receipt_number || "-") : "",
          billingStatus: isFirstRow ? formatHmoStatus(item.billing_status) : "",
          treatmentDate: item.created_at,
          serviceName: item.service_name || "HMO Service",
          price
        })

        isFirstRow = false
      })

      outputRows.push({
        kind: "patientTotal",
        key: `patient-total-${patientKey}`,
        total: patientTotal
      })

      itemNo += 1
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

    rows.value = buildRows(data)
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
