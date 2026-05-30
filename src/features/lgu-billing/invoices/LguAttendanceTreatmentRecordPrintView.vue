<template>
  <main class="min-h-screen bg-white text-black">
    <section class="mx-auto max-w-[1180px] px-6 py-6 space-y-4 print:px-0 print:py-0">
      <header class="space-y-2 border-b border-black pb-3">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h1 class="text-2xl font-bold tracking-tight">PHYSIOAVE</h1>
            <p class="text-xs uppercase tracking-[0.22em]">Attendance &amp; Treatment Record</p>
          </div>
          <div class="flex gap-2 print:hidden">
            <Button label="Print" icon="pi pi-print" @click="window.print()" />
            <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="router.back()" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
          <div>
            <div class="font-semibold">Patient</div>
            <div>{{ patientName }}</div>
          </div>
          <div>
            <div class="font-semibold">Patient ID</div>
            <div>{{ patientIdLabel }}</div>
          </div>
          <div>
            <div class="font-semibold">LGU Program</div>
            <div>{{ lguProgramLabel }}</div>
          </div>
        </div>
      </header>

      <section v-if="error" class="border border-black p-3 text-sm">
        {{ error }}
      </section>

      <template v-else>
        <section class="grid grid-cols-1 gap-3 md:grid-cols-4 text-sm">
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Attended Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ attendedCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Completed Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ completedCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Dropped Out Sessions</div>
            <div class="mt-1 text-lg font-bold">{{ droppedOutCount }}</div>
          </article>
          <article class="rounded-xl border border-black p-3">
            <div class="font-semibold uppercase tracking-wide text-xs">Billing Records</div>
            <div class="mt-1 text-lg font-bold">{{ billingCount }}</div>
          </article>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Attendance Log</h2>
          <div class="overflow-x-auto border border-black">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-black">
                  <th class="border-r border-black p-2 text-left w-[90px]">Session</th>
                  <th class="border-r border-black p-2 text-left w-[170px]">Date</th>
                  <th class="border-r border-black p-2 text-left">Package</th>
                  <th class="border-r border-black p-2 text-left">Services</th>
                  <th class="p-2 text-left w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(appointment, index) in appointments" :key="appointment.appointment_id" class="border-b border-black">
                  <td class="border-r border-black p-2">{{ index + 1 }}</td>
                  <td class="border-r border-black p-2">{{ formatDateTime(appointment.appointment_date) }}</td>
                  <td class="border-r border-black p-2">{{ appointment.package_name || '-' }}</td>
                  <td class="border-r border-black p-2">{{ appointment.availed_services?.length ? appointment.availed_services.join(', ') : '-' }}</td>
                  <td class="p-2">{{ formatStatus(appointment.status) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-2">
          <h2 class="text-sm font-bold uppercase tracking-[0.18em]">Treatment / Billing Record</h2>
          <div class="overflow-x-auto border border-black">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-black">
                  <th class="border-r border-black p-2 text-left w-[160px]">Reference</th>
                  <th class="border-r border-black p-2 text-left">Package / Service</th>
                  <th class="border-r border-black p-2 text-left w-[170px]">Program Status</th>
                  <th class="border-r border-black p-2 text-right w-[140px]">Amount</th>
                  <th class="p-2 text-left w-[160px]">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="billing in billings" :key="billing.id" class="border-b border-black">
                  <td class="border-r border-black p-2">{{ billing.public_id || `BILL-${billing.id}` }}</td>
                  <td class="border-r border-black p-2">{{ billing.package_name || billing.service_name || '-' }}</td>
                  <td class="border-r border-black p-2">{{ billing.billing_status }}</td>
                  <td class="border-r border-black p-2 text-right">{{ asCurrency(billing.amount_due) }}</td>
                  <td class="p-2">{{ formatDateTime(billing.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import Button from "primevue/button"
import { lguBillingService, type LguPatientCreditDetail } from "@/features/lgu-billing/api/lgu-billing.service"
import { billingPhase1Service, type BillingListItem } from "@/features/billing/api/billing-phase1.service"
import LguInvoiceLayout from "./LguInvoiceLayout.vue"
import { patientHMOInformationService } from "@/services/patient-hmo-information.service"
import type { PatientHMOInformation } from "@/models/hmo-information"


const dateSigned = computed(() => formatDate(new Date().toISOString()))
const route = useRoute()
const router = useRouter()

const detail = ref<LguPatientCreditDetail | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const billingDetail = ref<BillingListItem | null>(null)
const error = ref("")

const patientId = computed(() => {
  const raw = String(route.query.patient_id ?? "").trim()
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const patientName = computed(() => detail.value?.patient_name || "Patient")
const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")
const lguSponsor = computed(() => sponsorInfo.value)
const lguProgramLabel = computed(() => lguSponsor.value?.lgu_program_name || lguSponsor.value?.company_name || "LGU")
const patientAddress = computed(() => billingDetail.value?.patient_address || "N/A")
const patientAge = computed(() => billingDetail.value?.patient_age || "N/A")
const physicalTherapistName = computed(() => billingDetail.value?.physical_therapist || "N/A")
const doctorName = computed(() => billingDetail.value?.doctor || "N/A")
const diagnosis = computed(() => billingDetail.value?.diagnosis || "N/A")
const billingTo = computed(() => billingDetail.value?.lgu_program_name || lguSponsor.value?.company_name || lguProgramLabel.value)
const patientProgramStatus = computed(() => formatStatus(billingDetail.value?.lgu_patient_program_status || detail.value?.dropout_status))
const referralFormNo = computed(() => billingDetail.value?.lgu_reference_label || lguSponsor.value?.referral_form_no || "N/A")
const dateIssued = computed(() => formatDateTime(billingDetail.value?.lgu_date_issued || lguSponsor.value?.referral_issued_date))
const validityLabel = computed(() => {
  const start = formatDate(lguSponsor.value?.validity_start_date)
  const end = formatDate(lguSponsor.value?.validity_end_date)
  if (start === "N/A" && end === "N/A") return "N/A"
  return `${start} to ${end}`
})

const billing = computed(() => {
  const billings = detail.value?.billings ?? []
  const grandTotal = billings.reduce((sum, item) => sum + Number(item.amount_due ?? 0), 0)

  return {
    grand_total: grandTotal,
    total_amount: grandTotal
  }
})

type InvoiceLineNode = {
  id?: number | string
  type?: string
  name?: string
  quantity?: number
  price?: number
  unitPrice?: number
  lineTotal?: number
  treatmentDate?: string
  sessionSequence?: string
  subItems?: InvoiceLineNode[]
  children?: InvoiceLineNode[]
}

type TableRow = {
  key: string
  itemNo: string | number
  treatmentDate: string
  serviceName: string
  sessionSequence: string
  unitTotal: number | null
  level?: number
  isParent?: boolean
}

const parseInvoiceLineItems = (value?: string | null): InvoiceLineNode[] => {
  if (!value?.trim()) return []

  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? (parsed.filter(item => item && typeof item === "object") as InvoiceLineNode[])
      : []
  } catch {
    return []
  }
}

const getDirectChildren = (item: InvoiceLineNode): InvoiceLineNode[] => [
  ...(item.subItems ?? []),
  ...(item.children ?? [])
]

const getQuantity = (item: InvoiceLineNode): number => {
  const quantity = Math.floor(Number(item.quantity ?? 1))
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

const getTreatmentDate = (
  item: InvoiceLineNode,
  fallback: { treatmentDate?: string } = {}
): string =>
  item.treatmentDate ||
  fallback.treatmentDate ||
  billingDetail.value?.created_at ||
  ""

const getSessionUnitTotal = (item: InvoiceLineNode, quantity: number): number => {
  const lineTotal = Number(item.lineTotal)

  if (item.lineTotal !== undefined && item.lineTotal !== null && Number.isFinite(lineTotal)) {
    return lineTotal / quantity
  }

  const unitTotal = Number(item.unitPrice ?? item.price ?? 0)
  return Number.isFinite(unitTotal) ? unitTotal : 0
}

const flattenInvoiceLineItems = (
  items: InvoiceLineNode[],
  inherited: { treatmentDate?: string; sessionSequence?: string } = {},
  rows: TableRow[] = []
): TableRow[] => {
  let itemNoCounter = rows.filter(row => !row.isParent).length + 1

  items.forEach((parent, parentIndex) => {
    const parentTreatmentDate = getTreatmentDate(parent, inherited)
    const parentName = String(parent.name ?? "").trim() || "—"

    rows.push({
      key: `parent-${parentIndex + 1}-${String(parent.id ?? parent.name ?? "parent")}`,
      itemNo: "",
      treatmentDate: parentTreatmentDate,
      serviceName: parentName,
      sessionSequence: "",
      unitTotal: null,
      level: 0,
      isParent: true
    })

    getDirectChildren(parent).forEach(child => {
      const quantity = getQuantity(child)
      const childName = String(child.name ?? "").trim() || "—"
      const childTreatmentDate = getTreatmentDate(child, {
        treatmentDate: parentTreatmentDate
      })
      const unitTotal = getSessionUnitTotal(child, quantity)

      Array.from({ length: quantity }).forEach((_, sessionIndex) => {
        const itemNo = itemNoCounter

        rows.push({
          key: `item-${itemNo}-${String(child.id ?? child.name ?? "child")}-${sessionIndex + 1}`,
          itemNo,
          treatmentDate: childTreatmentDate,
          serviceName: childName,
          sessionSequence: `${sessionIndex + 1} / ${quantity}`,
          unitTotal,
          level: 1,
          isParent: false
        })

        itemNoCounter += 1
      })
    })
  })

  return rows
}
const invoiceRows = computed<TableRow[]>(() => {
  const lineItems = parseInvoiceLineItems(billingDetail.value?.line_items_json)
  if (lineItems.length) {
    return flattenInvoiceLineItems(lineItems)
  }

  return (detail.value?.package_availments ?? []).map((pkg, index) => ({
    key: String(pkg.authorization_id),
    itemNo: index + 1,
    treatmentDate: billingDetail.value?.created_at || "",
    serviceName: pkg.package_name || "—",
    sessionSequence: `${pkg.used_count} / ${pkg.availed_count}`,
    unitTotal: 0
  }))
})

const formatCurrency = (value?: number | null): string =>
  value === null || value === undefined
    ? ""
    : Number(value).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-PH")
}

const formatDate = (value?: string | null): string => {
  if (!value) return "N/A"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString("en-PH")
}

const formatStatus = (value?: string | null): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "COMPLETED") return "Completed"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (normalized === "PENDING") return "Pending"
  return value || "N/A"
}

const load = async (): Promise<void> => {
  error.value = ""
  detail.value = null
  sponsorInfo.value = null
  billingDetail.value = null

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const [detailResult, sponsorResult] = await Promise.all([
      lguBillingService.getPatientCreditDetail(patientId.value),
      patientHMOInformationService.getByPatientId(patientId.value)
    ])
    detail.value = detailResult ?? null
    sponsorInfo.value = (sponsorResult ?? []).find(item => item.sponsor_context === "LGU") ?? null

    const latestBilling = detail.value?.billings?.[0]
    if (latestBilling?.id) {
      billingDetail.value = await billingPhase1Service.getById(latestBilling.id) ?? null
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load patient LGU profile."
  }
}

onMounted(() => {
  void load().then(() => {
    if (String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => window.print(), 50)
    }
  })
})
</script>
