<template>
  <Dialog
    :visible="visible"
    modal
    header="Appointment Details"
    :style="{ width: '68rem', maxWidth: '96vw' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="appointment" class="space-y-5">
      <section class="app-appointment-card app-appointment-card-accent">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0">
            <div class="app-appointment-muted text-xs uppercase tracking-wide">Patient</div>
            <h3 class="app-appointment-title mt-1 truncate text-xl">{{ appointment.patient_name }}</h3>
            <div class="mt-2 flex flex-wrap gap-2">
              <Tag :value="appointment.appointment_status" :severity="statusSeverity(appointment.appointment_status)" />
              <Tag :value="formatPayer(appointment.payer_type)" severity="info" />
              <Tag :value="displayAppointmentPhase(appointment.appointment_phase)" severity="secondary" />
              <Tag
                v-if="appointment.reschedule_flag || Number(appointment.reschedule_count ?? 0) > 0"
                value="Rescheduled"
                severity="warn"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailTile label="Date" :value="formatDate(appointment.starts_at)" />
            <DetailTile label="Time" :value="`${formatTime(appointment.starts_at)} - ${formatTime(appointment.ends_at)}`" />
          </div>
        </div>
      </section>

      <section class="app-appointment-card space-y-3">
        <div class="flex items-center justify-between gap-3">
          <h4 class="app-appointment-title text-base">Schedule, Care Team and Status</h4>
          <Button
            :icon="showScheduleCareTeamStatus ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            text
            rounded
            severity="secondary"
            size="small"
            :aria-expanded="showScheduleCareTeamStatus"
            aria-label="Toggle schedule, care team and status"
            @click="showScheduleCareTeamStatus = !showScheduleCareTeamStatus"
          />
        </div>

        <div v-show="showScheduleCareTeamStatus" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div class="space-y-3 lg:col-span-2">
            <h5 class="app-appointment-title text-sm">Schedule and Care Team</h5>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <DetailField label="Clinic" :value="appointment.clinic_name" />
              <DetailField label="Location" :value="displayLocationContext(appointment.location_context)" />
              <DetailField label="PT" :value="appointment.provider_name || appointment.doctor_name" />
              <DetailField label="Referring Staff" :value="appointment.referring_staff_name || appointment.referring_doctor_name" />
              <DetailField label="Support Staff" :value="appointment.support_staff_name" />
              <DetailField label="Specialty" :value="appointment.specialty_tag_name" />
              <DetailField label="Clinic Area" :value="appointment.treatment_area_name" />
              <DetailField label="Appointment Type" :value="appointment.appointment_type" />
            </div>
          </div>

          <div class="space-y-3">
            <h5 class="app-appointment-title text-sm">Status</h5>
            <DetailField label="Billing Status" :value="appointment.billing_status" />
            <DetailField label="Billing Type" :value="displayBillingType" />
            <DetailField v-if="isLguAppointment" label="Dropout Status" :value="appointment.dropout_status" />
            <DetailField label="Reschedule Count" :value="String(appointment.reschedule_count ?? 0)" />
          </div>
        </div>
      </section>

      <section v-if="billingPreparation" class="app-appointment-card space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 class="app-appointment-title text-base">Billing</h4>
            <p class="app-appointment-muted mt-1 text-sm">
              {{ formatBillingPreparationStatus(billingPreparation.billing_path.status) }}
            </p>
            <p v-if="billingDocument" class="app-appointment-muted mt-1 text-xs">
              {{ billingDocument.document_number || `Document #${billingDocument.id}` }} ·
              {{ formatBillingPreparationStatus(billingDocument.document_status) }} ·
              Balance {{ formatMoney(billingDocument.totals.balance) }}
            </p>
          </div>

          <Button
            label="Open Billing"
            icon="pi pi-wallet"
            size="small"
            :pt="ptPrimaryBtn"
            @click="$emit('open-billing')"
          />
        </div>
      </section>

<section class="app-appointment-card space-y-3">
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h4 class="app-appointment-title text-base">Services</h4>
      <p class="app-appointment-muted mt-1 text-sm">
        Services and credits attached to this appointment.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Button
        v-if="canManageServices"
        label="Add Add-ons"
        icon="pi pi-plus"
        severity="secondary"
        outlined
        size="small"
        @click="$emit('manage-services')"
      />
      <Button
        v-if="canMarkAttendance"
        label="Attendance"
        icon="pi pi-check-square"
        severity="success"
        outlined
        size="small"
        @click="$emit('attendance')"
      />
    </div>
  </div>

  <div
    v-if="!plannedServicesList.length"
    class="rounded-lg border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-4 py-4 text-center text-sm text-[rgb(var(--app-fg))]/60"
  >
    No services recorded.
  </div>

  <div v-else class="space-y-2">
    <article
      v-for="group in plannedServiceGroups"
      :key="group.key"
      class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]"
    >
      <div class="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-2">
          <Button
            v-if="group.children.length"
            :icon="isPlannedServiceGroupExpanded(group.key) ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
            text
            rounded
            severity="secondary"
            size="small"
            class="-ml-1 shrink-0"
            :aria-expanded="isPlannedServiceGroupExpanded(group.key)"
            :aria-label="`Toggle ${plannedServiceName(group.service)} included services`"
            @click="togglePlannedServiceGroup(group.key)"
          />
          <span v-else class="w-8 shrink-0" />

          <div class="min-w-0">
            <div class="break-words text-sm font-semibold text-[rgb(var(--app-fg))]">
              {{ plannedServiceName(group.service) }}
            </div>

            <div class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">
              {{ group.children.length ? 'Bundle' : plannedServiceType(group.service) }}
            </div>
          </div>
        </div>
      </div>

      <div v-show="group.children.length && isPlannedServiceGroupExpanded(group.key)" class="border-t border-[rgb(var(--app-border))] px-3 py-2">
        <div class="space-y-2">
          <div
            v-for="child in group.children"
            :key="plannedServiceKey(child)"
            class="flex flex-col gap-2 rounded-md bg-[rgb(var(--app-card))] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="break-words text-sm font-semibold text-[rgb(var(--app-fg))]">
                {{ plannedServiceName(child) }}
              </div>

              <div class="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--app-fg))]/50">
                {{ plannedServiceType(child) }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </article>
  </div>
</section>
    </div>

    <template #footer>
      <Button label="Close" severity="secondary" outlined @click="$emit('update:visible', false)" />
      <Button v-if="canMarkAttendance" label="Attendance" icon="pi pi-check-square" severity="success" outlined @click="$emit('attendance')" />
      <Button v-if="canReschedule" label="Reschedule" icon="pi pi-calendar-plus" severity="warn" outlined @click="$emit('reschedule')" />
      <Button v-if="canEdit" label="Edit Appointment" icon="pi pi-pencil" :pt="ptPrimaryBtn" @click="$emit('edit')" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch, type PropType } from "vue"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Tag from "primevue/tag"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type { AppointmentListItem } from "@/features/appointments/api/appointment-phase1.service"
import type { AppointmentBillingPreparation } from "@/features/appointments/api/appointment-billing.service"

type PlannedServiceRecord = Record<string, any>
type PlannedServiceGroup = {
  key: string
  service: PlannedServiceRecord
  children: PlannedServiceRecord[]
}

const props = withDefaults(defineProps<{
  visible: boolean
  appointment: AppointmentListItem | null
  plannedServices?: PlannedServiceRecord[]
  consumedServices?: PlannedServiceRecord[]
  billingPreparation?: AppointmentBillingPreparation | null
  billingDocument?: {
    id: number
    document_number?: string | null
    document_status: string
    totals: { balance: number }
  } | null
  isBillingActionLoading?: boolean
  formatDate: (value: string) => string
  formatTime: (value: string) => string
  formatPayer: (value?: string | null) => string
  statusSeverity: (value?: string) => "success" | "warn" | "danger" | "info"
  displayAppointmentPhase: (value?: string) => string
  displayLocationContext: (value?: string) => string
  displayLaterality: (value?: string | null) => string
  formatOptionalNumber: (value?: number | null) => string | undefined
  canEdit?: boolean
  canReschedule?: boolean
  canMarkAttendance?: boolean
  canManageServices?: boolean
}>(), {
  plannedServices: () => [],
  consumedServices: () => [],
  billingPreparation: null,
  billingDocument: null,
  isBillingActionLoading: false,
  canEdit: true,
  canReschedule: true,
  canMarkAttendance: true,
  canManageServices: true
})

defineEmits<{
  "update:visible": [value: boolean]
  edit: []
  reschedule: []
  attendance: []
  "manage-services": []
  "open-billing": []
  "create-self-pay-appointment-bill": []
  "create-self-pay-package-bill": []
  "create-session-documentation-invoice": []
}>()

const plannedServicesList = computed(() => props.plannedServices ?? [])
const consumedServicesList = computed(() => props.consumedServices ?? [])
const showScheduleCareTeamStatus = ref(false)
const expandedPlannedServiceGroups = ref<Set<string>>(new Set())

watch(() => props.visible, (visible) => {
  if (visible) {
    showScheduleCareTeamStatus.value = false
    expandedPlannedServiceGroups.value = new Set()
  }
})

watch(() => props.appointment?.id, () => {
  showScheduleCareTeamStatus.value = false
  expandedPlannedServiceGroups.value = new Set()
})

const normalizeToken = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const isLguAppointment = computed(() =>
  normalizeToken(props.appointment?.payer_type) === "LGU" ||
  normalizeToken(props.appointment?.billing_type) === "LGU"
)

const displayBillingType = computed(() =>
  props.formatPayer(props.appointment?.payer_type || props.appointment?.billing_type || null)
)

const formatBillingPreparationStatus = (value?: string | null): string =>
  String(value ?? "N/A")
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

const firstValue = (record: PlannedServiceRecord, keys: string[]): unknown =>
  keys.map(key => record?.[key]).find(value => value !== undefined && value !== null && String(value).trim() !== "")

const numberValue = (value: unknown, fallback = 0): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value ?? 0))

const plannedServiceKey = (service: PlannedServiceRecord): string => {
  const key = firstValue(service, ["id", "credit_item_id", "service_id", "name", "service_name"])
  return `${String(key ?? Math.random())}-${plannedServiceName(service)}`
}

const consumedServiceKey = (service: PlannedServiceRecord): string => {
  const key = firstValue(service, ["id", "credit_consumption_id", "credit_item_id", "service_id", "service_name"])
  return `${String(key ?? Math.random())}-${plannedServiceName(service)}`
}

const plannedServiceName = (service: PlannedServiceRecord): string =>
  String(firstValue(service, ["service_name", "name", "item_name", "credit_item_name", "description"]) ?? "Unnamed service")

const plannedServiceType = (service: PlannedServiceRecord): string =>
  String(firstValue(service, ["type", "service_type", "service_category", "credit_type"]) ?? "Service")
    .split("_")
    .join(" ")

const plannedServiceId = (service: PlannedServiceRecord): number | null => {
  const id = Number(firstValue(service, ["credit_item_id", "id"]))
  return Number.isFinite(id) && id > 0 ? id : null
}

const plannedServiceParentId = (service: PlannedServiceRecord): number | null => {
  const id = Number(firstValue(service, ["parent_credit_item_id"]))
  return Number.isFinite(id) && id > 0 ? id : null
}

const plannedServiceTypeToken = (service: PlannedServiceRecord): string =>
  normalizeToken(String(firstValue(service, ["type", "service_type", "service_category", "credit_type"]) ?? ""))

const isPackagePlannedService = (service: PlannedServiceRecord): boolean =>
  plannedServiceTypeToken(service) === "PACKAGE"

const isBundlePlannedService = (service: PlannedServiceRecord): boolean =>
  plannedServiceTypeToken(service) === "BUNDLE"

const plannedServiceGroupKey = (service: PlannedServiceRecord, fallbackIndex = 0): string =>
  `planned-service-group-${plannedServiceId(service) ?? `${plannedServiceName(service)}-${fallbackIndex}`}`

const plannedServiceGroups = computed<PlannedServiceGroup[]>(() => {
  const services = plannedServicesList.value
  const byId = new Map<number, PlannedServiceRecord>()
  services.forEach((service) => {
    const id = plannedServiceId(service)
    if (id) byId.set(id, service)
  })

  const hasPackage = services.some(isPackagePlannedService)
  const groups: PlannedServiceGroup[] = []
  const groupedChildIds = new Set<number>()
  const groupedParentIds = new Set<number>()

  services
    .filter(isBundlePlannedService)
    .forEach((bundle, index) => {
      const bundleId = plannedServiceId(bundle)
      const children = services.filter((service) =>
        !isPackagePlannedService(service) &&
        !isBundlePlannedService(service) &&
        bundleId !== null &&
        plannedServiceParentId(service) === bundleId
      )

      children.forEach((child) => {
        const childId = plannedServiceId(child)
        if (childId) groupedChildIds.add(childId)
      })
      if (bundleId) groupedParentIds.add(bundleId)

      groups.push({
        key: plannedServiceGroupKey(bundle, index),
        service: bundle,
        children
      })
    })

  services.forEach((service, index) => {
    const serviceId = plannedServiceId(service)
    if (serviceId && groupedParentIds.has(serviceId)) return
    if (serviceId && groupedChildIds.has(serviceId)) return
    if (isPackagePlannedService(service)) return

    const parent = plannedServiceParentId(service)
    const parentService = parent ? byId.get(parent) : null
    if (hasPackage && parentService && isPackagePlannedService(parentService)) return

    groups.push({
      key: plannedServiceGroupKey(service, index),
      service,
      children: []
    })
  })

  return groups
})

const isPlannedServiceGroupExpanded = (key: string): boolean =>
  expandedPlannedServiceGroups.value.has(key)

const togglePlannedServiceGroup = (key: string): void => {
  const next = new Set(expandedPlannedServiceGroups.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedPlannedServiceGroups.value = next
}

const plannedQuantity = (service: PlannedServiceRecord): number =>
  numberValue(firstValue(service, ["planned_quantity", "quantity", "qty", "total_quantity"]), 0)

const consumedQuantity = (service: PlannedServiceRecord): number =>
  numberValue(firstValue(service, ["appointment_consumed_quantity", "consumed_quantity", "used_quantity", "finished_quantity", "completed_quantity"]), 0)

const remainingQuantity = (service: PlannedServiceRecord): number => {
  const explicitRemaining = firstValue(service, ["remaining_quantity", "balance_quantity", "remaining"])
  if (explicitRemaining !== undefined) return Math.max(0, numberValue(explicitRemaining, 0))
  return Math.max(0, plannedQuantity(service) - consumedQuantity(service))
}

const plannedServiceStatus = (service: PlannedServiceRecord): string => {
  if (plannedQuantity(service) > 0 && remainingQuantity(service) <= 0) return "Completed"
  if (consumedQuantity(service) > 0) return "Partial"
  return "Pending"
}

const plannedServiceSeverity = (service: PlannedServiceRecord): "success" | "warn" | "info" => {
  const status = plannedServiceStatus(service)
  if (status === "Completed") return "success"
  if (status === "Partial") return "warn"
  return "info"
}

const DetailTile = defineComponent({
  name: "DetailTile",
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  setup(props) {
    return () => h("div", { class: "app-appointment-card px-4 py-3" }, [
      h("div", { class: "app-appointment-muted text-xs uppercase tracking-wide" }, props.label),
      h("div", { class: "app-appointment-value mt-1 font-semibold" }, props.value)
    ])
  }
})

const DetailField = defineComponent({
  name: "DetailField",
  props: {
    label: { type: String, required: true },
    value: { type: String as PropType<string | undefined | null>, default: undefined }
  },
  setup(props) {
    return () => h("div", { class: "rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2" }, [
      h("div", { class: "app-appointment-muted text-[11px] font-semibold uppercase tracking-wide" }, props.label),
      h("div", { class: "app-appointment-value mt-1 break-words text-sm font-medium" }, props.value?.toString().trim() || "Not recorded")
    ])
  }
})
</script>
