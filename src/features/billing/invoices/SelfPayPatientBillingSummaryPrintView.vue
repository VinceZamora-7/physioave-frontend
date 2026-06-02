<template>
  <HmoInvoiceLayout
    title="PATIENT BILLING SUMMARY"
    :subtitle="`Self Pay printable record for ${patientName}`"
    :has-error="!!error"
  >
    <template #meta>
      <strong>BILLING DATE:</strong><span>{{ billingDateLabel }}</span>
      <strong>REFERENCE NO.:</strong><span>{{ referenceNoLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="printPage" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-if="!error" #details>
      <div class="profile-details">
        <div class="profile-card">
          <div class="profile-grid">
            <div class="profile-group">
              <div class="profile-row">
                <span class="profile-label">Patient Name:</span>
                <span class="profile-value">{{ patientName }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Address:</span>
                <span class="profile-value">{{ patientAddress }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Age:</span>
                <span class="profile-value">{{ patientAge }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Physical Therapist:</span>
                <span class="profile-value">{{ physicalTherapist }}</span>
              </div>
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Doctor:</span>
                <span class="profile-value">{{ doctor }}</span>
              </div>
              <div class="profile-row profile-row--wide-label">
                <span class="profile-label">Diagnosis:</span>
                <span class="profile-value">{{ diagnosis }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <div class="table-wrap">
        <table class="summary-table">
          <thead>
            <tr>
              <th class="w-[50px] text-center">ITEM No.</th>
              <th class="w-[90px] text-center">BILLING DATE</th>
              <th class="w-[150px] text-center">PT SERVICE RENDERED</th>
              <th class="w-[40px] text-center">QTY.</th>
              <th class="w-[80px] text-center">BODY AREA</th>
              <th class="w-[70px] text-center">UNIT PRICE</th>
              <th class="w-[70px] text-center">UNIT TOTAL</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td class="text-center">{{ row.itemNo }}</td>
              <td class="text-center">{{ row.billingDate }}</td>
              <td class="text-center">{{ row.serviceName }}</td>
              <td class="text-center">{{ row.quantity }}</td>
              <td class="text-center">{{ row.bodyArea }}</td>
              <td class="text-center">{{ formatCurrency(row.unitPrice) }}</td>
              <td class="text-center">{{ formatCurrency(row.unitTotal) }}</td>
            </tr>
          </tbody>

          <tfoot>
            <tr>
              <td colspan="6" class="text-right font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                Grand Total:
              </td>
              <td class="text-center font-bold" style="padding-top: 12px; border-top: 1px solid #e5e7eb;">
                {{ formatCurrency(grandTotal) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <template #bottom>
      <div
        style="
          width: 100%;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          font-size: 13px;
          color: #111827;
        "
      >
        <div class="payment-box">
          <h3>PAYMENT DETAILS</h3>
          <div><strong>Billing Type:</strong> {{ billingTypeLabel }}</div>
          <div><strong>Payment Method:</strong> {{ paymentMethodLabel }}</div>
          <div><strong>Payment Reference:</strong> {{ paymentReferenceLabel }}</div>
          <div><strong>Amount Paid:</strong> {{ formatCurrency(amountPaid) }}</div>
        </div>

        <div
          style="
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 320px;
          "
        >
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #374151;">
            Approved by:
          </div>

          <div style="font-weight: 700; color: #111827;">
            RENALOU B. CORDOVA, PTRP, UK-PT
          </div>

          <div style="width: 260px; margin-bottom: 1px; border-bottom: 1px solid #111827;"></div>

          <div style="margin-bottom: 2px; color: #4b5563;">
            Chief Operations Officer
          </div>

          <div style="margin-bottom: 18px; font-size: 12px; font-weight: 600; color: #374151;">
            Date Signed: {{ dateSigned }}
          </div>
        </div>
      </div>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import type { BillingListItem } from "@/features/billing/api/billing-phase1.service"
import { billingContextTanstackService } from "@/features/billing/queries/billing-context.tanstack.service"
import HmoInvoiceLayout from "@/features/hmo-billing/invoices/HmoInvoiceLayout.vue"
import { useHmoInvoicePrintActions } from "@/features/hmo-billing/invoices/hmo-invoice.shared"

type SelfPaySummaryRow = {
  key: string
  itemNo: number
  billingDate: string
  serviceName: string
  quantity: number
  bodyArea: string
  unitPrice: number
  unitTotal: number
}

type SelfPayLineItem = {
  id?: number | string
  name?: string
  quantity?: number | string
  price?: number | string
  unitPrice?: number | string
  unit_price?: number | string
  body_area?: string
  bodyArea?: string
}

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useHmoInvoicePrintActions()

const billingDetail = ref<BillingListItem | null>(null)
const rows = ref<SelfPaySummaryRow[]>([])
const error = ref("")

const billingId = computed(() => {
  const parsed = Number(String(route.query.billing_id ?? route.query.id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

const formatDate = (value?: string | null): string => {
  if (!value) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("en-PH")
}

const formatCurrency = (value?: number | null): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const parseLineItems = (billing: BillingListItem): SelfPayLineItem[] => {
  try {
    const parsed = JSON.parse(billing.line_items_json || "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item === "object") as SelfPayLineItem[] : []
  } catch {
    return []
  }
}

const getBillingRecordId = (billing?: BillingListItem | null): string =>
  billing ? firstNonBlank(billing.public_id, `BILLING-${billing.id}`) : "N/A"

const patientName = computed(() =>
  firstNonBlank(billingDetail.value?.patient_name, billingDetail.value?.patient_public_id, billingDetail.value?.patient_id, "Patient")
)
const patientAddress = computed(() => firstNonBlank(billingDetail.value?.patient_address, "N/A"))
const patientAge = computed(() => firstNonBlank(billingDetail.value?.patient_age, "N/A"))
const physicalTherapist = computed(() => firstNonBlank(billingDetail.value?.physical_therapist, "N/A"))
const doctor = computed(() => firstNonBlank(billingDetail.value?.doctor, "N/A"))
const diagnosis = computed(() => firstNonBlank(billingDetail.value?.diagnosis, "N/A"))
const billingDateLabel = computed(() => formatDate(billingDetail.value?.created_at))
const referenceNoLabel = computed(() => getBillingRecordId(billingDetail.value))
const billingTypeLabel = computed(() =>
  String(billingDetail.value?.billing_type ?? "Self Pay").replace(/_/g, " ")
)
const paymentMethodLabel = computed(() =>
  firstNonBlank(billingDetail.value?.payment_method_name, billingDetail.value?.payment_reference, "Self Pay")
)
const paymentReferenceLabel = computed(() =>
  firstNonBlank(billingDetail.value?.receipt_number, billingDetail.value?.payment_reference, "N/A")
)
const amountPaid = computed(() => Number(billingDetail.value?.amount_paid ?? 0))
const dateSigned = computed(() =>
  new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
)
const grandTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + Number(row.unitTotal ?? 0), 0)
)

const buildRows = (billing: BillingListItem): SelfPaySummaryRow[] => {
  const lineItems = parseLineItems(billing)
  const billingDate = formatDate(billing.created_at)

  if (!lineItems.length) {
    const unitPrice = Number(billing.total_amount ?? billing.amount_due ?? 0)
    return [{
      key: `${billing.id}-1`,
      itemNo: 1,
      billingDate,
      serviceName: billing.service_name || "Self Pay Service",
      quantity: 1,
      bodyArea: "N/A",
      unitPrice,
      unitTotal: unitPrice
    }]
  }

  return lineItems.map((line, index) => {
    const quantity = Math.max(1, Number(line.quantity ?? 1))
    const unitPrice = Number(line.price ?? line.unitPrice ?? line.unit_price ?? 0)
    return {
      key: `${billing.id}-${index}`,
      itemNo: index + 1,
      billingDate,
      serviceName: String(line.name ?? billing.service_name ?? "Self Pay Service"),
      quantity,
      bodyArea: firstNonBlank(line.body_area, line.bodyArea, "N/A"),
      unitPrice,
      unitTotal: quantity * unitPrice
    }
  })
}

const load = async (): Promise<void> => {
  error.value = ""
  billingDetail.value = null
  rows.value = []

  if (!billingId.value) {
    error.value = "Billing ID is required."
    return
  }

  try {
    const context = await billingContextTanstackService.fetchContext(queryClient, billingId.value)
    billingDetail.value = context?.billing ?? null
    if (!billingDetail.value) {
      error.value = "Billing record was not found."
      return
    }
    rows.value = buildRows(billingDetail.value)
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load self pay billing summary."
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
