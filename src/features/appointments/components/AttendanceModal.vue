<template>
  <Dialog
    :visible="visible"
    modal
    header="Attendance"
    :style="{ width: '58rem', maxWidth: '96vw' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div v-if="appointment" class="space-y-4">
      <div class="app-appointment-card">
        <div class="font-semibold">{{ appointment.patient_name }}</div>
        <div class="text-sm opacity-70">
          {{ formatDate(appointment.starts_at) }} -
          {{ formatTime(appointment.starts_at) }} to {{ formatTime(appointment.ends_at) }}
        </div>
      </div>

      <DataTable :value="attendanceItems" size="small" class="app-data-table">
        <template #empty>
          <div class="py-8 text-center text-sm opacity-70">
            No planned services available. Add planned services first.
          </div>
        </template>

        <Column header="Done" style="width: 90px">
          <template #body="{ data }">
            <Checkbox
              v-model="data.selected"
              binary
              :disabled="isAttendanceItemDisabled(data)"
            />
          </template>
        </Column>

        <Column header="Service">
          <template #body="{ data }">
            <div>
              <div class="font-medium">{{ data.service_name }}</div>
              <div class="text-xs opacity-60">
                Planned {{ data.planned_quantity }} -
                This visit {{ data.appointmentConsumed ?? data.appointment_consumed_quantity ?? 0 }} -
                Balance {{ data.remaining }}
              </div>
            </div>
          </template>
        </Column>

        <Column header="Qty Finished" style="width: 160px">
          <template #body="{ data }">
            <InputNumber
              v-model="data.quantity"
              :min="1"
              :max="Math.max(1, data.remaining)"
              showButtons
              fluid
              :disabled="!data.selected || isAttendanceItemDisabled(data)"
            />
          </template>
        </Column>
      </DataTable>

      <section class="app-appointment-card app-appointment-card-accent space-y-3">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 class="app-appointment-title text-base">Encounter Ticket</h4>
            <p class="app-appointment-muted mt-1 text-sm">
              Ask the patient to sign below to confirm attendance completion.
            </p>
          </div>

          <Button
            label="Clear Patient Signature"
            icon="pi pi-eraser"
            severity="secondary"
            outlined
            size="small"
            :disabled="isSaving || isTicketLocked"
            @click="clearSignature"
          />
        </div>

        <div
          class="overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2"
        >
          <canvas
            ref="signatureCanvas"
            class="block h-44 w-full touch-none rounded-lg bg-white"
            @pointerdown="startSignature"
            @pointermove="drawSignature"
            @pointerup="stopSignature"
            @pointercancel="stopSignature"
            @pointerleave="stopSignature"
            @contextmenu.prevent
          />
        </div>

        <div class="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p class="app-appointment-muted">
            Signature of {{ appointment.patient_name || "patient" }}
          </p>

          <p v-if="signatureError" class="font-medium text-red-500">
            {{ signatureError }}
          </p>

          <p v-else-if="hasSignature" class="font-medium text-green-600">
            Signature captured
          </p>

          <p v-else class="font-medium text-orange-500">
            Required to complete attendance
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 class="app-appointment-title text-base">PT / Admin Confirmation</h4>
            <p class="app-appointment-muted mt-1 text-sm">
              The attending PT or an authorized admin can sign now, or complete confirmation later.
            </p>
          </div>

          <Button
            label="Clear Staff Signature"
            icon="pi pi-eraser"
            severity="secondary"
            outlined
            size="small"
            :disabled="isSaving"
            @click="clearStaffSignature"
          />
        </div>

        <div class="overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2">
          <canvas
            ref="staffSignatureCanvas"
            class="block h-44 w-full touch-none rounded-lg bg-white"
            @pointerdown="startStaffSignature"
            @pointermove="drawStaffSignature"
            @pointerup="stopStaffSignature"
            @pointercancel="stopStaffSignature"
            @pointerleave="stopStaffSignature"
            @contextmenu.prevent
          />
        </div>

        <div class="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p class="app-appointment-muted">Signature of PT / Admin</p>

          <p v-if="staffSignatureError" class="font-medium text-red-500">
            {{ staffSignatureError }}
          </p>

          <p v-else-if="hasStaffSignature" class="font-medium text-green-600">
            Staff confirmation captured
          </p>

          <p v-else class="font-medium text-orange-500">
            Optional; can be filled later
          </p>
        </div>

        <div class="space-y-1">
          <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Encounter Notes</label>
          <Textarea
            v-model="encounterNotes"
            class="w-full"
            rows="2"
            autoResize
            :disabled="isSaving"
            placeholder="Optional attendance notes"
          />
        </div>

        <div
          v-if="encounterTicket"
          class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2 text-xs"
        >
          <span class="font-semibold">{{ isTicketLocked ? "Completed encounter ticket" : "Saved encounter ticket draft" }}</span>
          <span v-if="encounterTicket.slip_number" class="ml-2 opacity-70">{{ encounterTicket.slip_number }}</span>
        </div>
      </section>

      <section
  v-if="canShowDropoutPanel"
  class="app-appointment-card app-appointment-card-accent space-y-3"
>
  <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0 flex-1 space-y-1">
      <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">
        LGU Drop-out Reason
      </label>

      <Textarea
        v-model="dropoutReason"
        class="w-full"
        rows="2"
        autoResize
        :disabled="isDroppingOut || isAlreadyDroppedOut"
        placeholder="Reason for dropping out"
      />
    </div>

    <div class="flex shrink-0 flex-col gap-2 sm:flex-row md:items-end">
      <Button
        v-if="!isAlreadyDroppedOut"
        label="Drop Out Patient"
        icon="pi pi-user-minus"
        severity="danger"
        class="whitespace-nowrap"
        :loading="isDroppingOut"
        :disabled="!dropoutReason.trim()"
        @click="$emit('drop-out', dropoutReason.trim())"
      />

      <Button
        v-else
        label="Undo Drop Out"
        icon="pi pi-undo"
        severity="secondary"
        outlined
        class="whitespace-nowrap"
        :loading="isDroppingOut"
        @click="$emit('undo-drop-out')"
      />
    </div>
  </div>
</section>
    </div>

    <template #footer>
      <Button
        label="Close"
        severity="secondary"
        outlined
        @click="$emit('update:visible', false)"
      />

      <Button
        label="Save Ticket Draft"
        icon="pi pi-save"
        severity="secondary"
        outlined
        :loading="isSaving"
        :disabled="isSaving"
        @click="submitEncounterTicketDraft"
      />

      <Button
        label="Save Attendance"
        icon="pi pi-check"
        :loading="isSaving"
        :disabled="isSaving || isTicketLocked"
        :pt="ptPrimaryBtn"
        @click="submitAttendance"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Textarea from "primevue/textarea"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import type {
  AppointmentEncounterTicket,
  AppointmentListItem,
  AppointmentPlannedService
} from "@/features/appointments/api/appointment-phase1.service"

type AttendanceItem = AppointmentPlannedService & {
  selected: boolean
  quantity: number
  remaining: number
  appointmentConsumed?: number
}

type AppointmentWithDropoutFields = AppointmentListItem & {
  dropout_reason?: string | null
  dropout_status?: string | null
  lgu_patient_id?: number | string | null
  lgu_contract_id?: number | string | null
  payer_type?: string | null
  billing_type?: string | null
  source_type?: string | null
  payment_source?: string | null
  contract_type?: string | null
  sponsor_context?: string | null
}

type AttendanceSignaturePayload = {
  patient_signature_data_url?: string | null
  patient_signature_signed_at?: string | null
  patient_signature_signed_by?: string | null
  pt_signature_data_url?: string | null
  pt_confirmed_at?: string | null
  pt_completion_tag?: string | null
  notes?: string | null
}

const emit = defineEmits<{
  "update:visible": [value: boolean]
  save: [payload: AttendanceSignaturePayload]
  "save-draft": [payload: AttendanceSignaturePayload]
  "drop-out": [reason: string]
  "undo-drop-out": []
}>()

const props = defineProps<{
  visible: boolean
  appointment: AppointmentWithDropoutFields | null
  encounterTicket?: AppointmentEncounterTicket | null
  attendanceItems: AttendanceItem[]
  isSaving: boolean
  isDroppingOut?: boolean
  canDropOutLgu?: boolean
  dropoutStatus?: string | null
  formatDate: (value: string) => string
  formatTime: (value: string) => string
}>()

const dropoutReason = ref("")
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const staffSignatureCanvas = ref<HTMLCanvasElement | null>(null)
const isSigning = ref(false)
const isStaffSigning = ref(false)
const hasSignature = ref(false)
const hasStaffSignature = ref(false)
const signatureError = ref("")
const staffSignatureError = ref("")
const encounterNotes = ref("")

const isTicketLocked = computed(() => Boolean(props.encounterTicket?.record_locked))

const normalizeStatus = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase()

const normalizeToken = (value?: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")

const isLguValue = (value?: unknown): boolean => {
  const normalized = normalizeToken(value)
  return normalized === "LGU" || normalized === "LGU_BILLING" || normalized.includes("LGU")
}

const isAlreadyDroppedOut = computed(() =>
  normalizeStatus(props.dropoutStatus ?? props.appointment?.dropout_status) === "DROPPED_OUT"
)

const canShowDropoutPanel = computed(() => {
  const appointment = props.appointment
  if (!appointment) return false

  return Boolean(
    props.canDropOutLgu ||
    isAlreadyDroppedOut.value ||
    appointment.lgu_patient_id ||
    appointment.lgu_contract_id ||
    isLguValue(appointment.payer_type) ||
    isLguValue(appointment.billing_type) ||
    isLguValue(appointment.source_type) ||
    isLguValue(appointment.payment_source) ||
    isLguValue(appointment.contract_type) ||
    isLguValue(appointment.sponsor_context)
  )
})

const selectedBundleIds = computed(() =>
  new Set(
    props.attendanceItems
      .filter(item => item.selected && item.type === "BUNDLE")
      .map(item => Number(item.id))
  )
)

const isAttendanceItemDisabled = (item: AttendanceItem): boolean =>
  item.remaining <= 0
  || item.type === "PACKAGE"
  || Number(item.appointmentConsumed ?? item.appointment_consumed_quantity ?? 0) > 0
  || Boolean(item.parent_credit_item_id && selectedBundleIds.value.has(Number(item.parent_credit_item_id)))

const getCanvasContext = (canvas: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  if (!canvas) return null

  const context = canvas.getContext("2d")
  if (!context) return null

  context.lineWidth = 2
  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111827"

  return context
}

const getPointerPosition = (event: PointerEvent, canvas: HTMLCanvasElement | null): { x: number; y: number } | null => {
  if (!canvas) return null

  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

const drawExistingSignature = (canvas: HTMLCanvasElement, dataUrl?: string | null, afterLoad?: () => void): void => {
  if (!dataUrl) return

  const image = new Image()
  image.onload = () => {
    const context = canvas.getContext("2d")
    if (!context) return

    const rect = canvas.getBoundingClientRect()
    context.drawImage(image, 0, 0, rect.width, rect.height)
    afterLoad?.()
  }
  image.src = dataUrl
}

const initializeCanvas = (
  canvas: HTMLCanvasElement | null,
  existingSignature: string | null | undefined,
  markLoaded: () => void,
  markCleared: () => void
): void => {
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const ratio = window.devicePixelRatio || 1

  canvas.width = Math.max(1, Math.floor(rect.width * ratio))
  canvas.height = Math.max(1, Math.floor(rect.height * ratio))

  const context = canvas.getContext("2d")
  if (!context) return

  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, rect.width, rect.height)

  context.lineWidth = 2
  context.lineCap = "round"
  context.lineJoin = "round"
  context.strokeStyle = "#111827"

  markCleared()
  drawExistingSignature(canvas, existingSignature, markLoaded)
}

const initializeSignatureCanvas = (): void => {
  initializeCanvas(
    signatureCanvas.value,
    props.encounterTicket?.patient_signature_data_url,
    () => {
      hasSignature.value = true
      signatureError.value = ""
    },
    () => {
      hasSignature.value = false
      signatureError.value = ""
    }
  )
}

const initializeStaffSignatureCanvas = (): void => {
  initializeCanvas(
    staffSignatureCanvas.value,
    props.encounterTicket?.pt_signature_data_url,
    () => {
      hasStaffSignature.value = true
      staffSignatureError.value = ""
    },
    () => {
      hasStaffSignature.value = false
      staffSignatureError.value = ""
    }
  )
}

const initializeSignatureCanvases = (): void => {
  initializeSignatureCanvas()
  initializeStaffSignatureCanvas()
}

const resetPatientSignatureState = (): void => {
  hasSignature.value = false
  signatureError.value = ""
}

const startSignature = (event: PointerEvent): void => {
  if (props.isSaving || isTicketLocked.value) return

  const canvas = signatureCanvas.value
  const context = getCanvasContext(canvas)
  const position = getPointerPosition(event, canvas)

  if (!canvas || !context || !position) return

  canvas.setPointerCapture?.(event.pointerId)

  isSigning.value = true
  signatureError.value = ""

  context.beginPath()
  context.moveTo(position.x, position.y)
}

const drawSignature = (event: PointerEvent): void => {
  if (!isSigning.value || props.isSaving || isTicketLocked.value) return

  const context = getCanvasContext(signatureCanvas.value)
  const position = getPointerPosition(event, signatureCanvas.value)

  if (!context || !position) return

  context.lineTo(position.x, position.y)
  context.stroke()

  hasSignature.value = true
  signatureError.value = ""
}

const stopSignature = (event?: PointerEvent): void => {
  const canvas = signatureCanvas.value

  if (canvas && event) {
    try {
      canvas.releasePointerCapture?.(event.pointerId)
    } catch {
      // Ignore release errors when the pointer was not captured.
    }
  }

  isSigning.value = false
}

const clearSignature = (): void => {
  initializeCanvas(signatureCanvas.value, null, () => {}, resetPatientSignatureState)
}

const startStaffSignature = (event: PointerEvent): void => {
  if (props.isSaving) return

  const canvas = staffSignatureCanvas.value
  const context = getCanvasContext(canvas)
  const position = getPointerPosition(event, canvas)

  if (!canvas || !context || !position) return

  canvas.setPointerCapture?.(event.pointerId)
  isStaffSigning.value = true
  staffSignatureError.value = ""

  context.beginPath()
  context.moveTo(position.x, position.y)
}

const drawStaffSignature = (event: PointerEvent): void => {
  if (!isStaffSigning.value || props.isSaving) return

  const context = getCanvasContext(staffSignatureCanvas.value)
  const position = getPointerPosition(event, staffSignatureCanvas.value)

  if (!context || !position) return

  context.lineTo(position.x, position.y)
  context.stroke()

  hasStaffSignature.value = true
  staffSignatureError.value = ""
}

const stopStaffSignature = (event?: PointerEvent): void => {
  const canvas = staffSignatureCanvas.value

  if (canvas && event) {
    try {
      canvas.releasePointerCapture?.(event.pointerId)
    } catch {
      // Ignore release errors when the pointer was not captured.
    }
  }

  isStaffSigning.value = false
}

const clearStaffSignature = (): void => {
  initializeCanvas(
    staffSignatureCanvas.value,
    null,
    () => {},
    () => {
      hasStaffSignature.value = false
      staffSignatureError.value = ""
    }
  )
}

const buildEncounterTicketPayload = (): AttendanceSignaturePayload => ({
  patient_signature_data_url: hasSignature.value ? signatureCanvas.value?.toDataURL("image/png") ?? null : null,
  patient_signature_signed_at: hasSignature.value ? new Date().toISOString() : null,
  patient_signature_signed_by: props.appointment?.patient_name ?? null,
  pt_signature_data_url: hasStaffSignature.value ? staffSignatureCanvas.value?.toDataURL("image/png") ?? null : null,
  pt_confirmed_at: hasStaffSignature.value ? new Date().toISOString() : null,
  pt_completion_tag: "ATTENDANCE_CONFIRMED",
  notes: encounterNotes.value.trim() || null
})

const submitEncounterTicketDraft = (): void => {
  if (!props.appointment || isTicketLocked.value) return
  emit("save-draft", buildEncounterTicketPayload())
}

const submitAttendance = (): void => {
  if (!props.appointment) return

  if (!hasSignature.value) {
    signatureError.value = "Patient signature is required to complete attendance."
    return
  }

  emit("save", buildEncounterTicketPayload())
}

watch(
  () => [
    props.visible,
    props.appointment?.id,
    props.appointment?.dropout_reason,
    props.encounterTicket?.id,
    props.encounterTicket?.patient_signature_data_url,
    props.encounterTicket?.pt_signature_data_url,
    props.encounterTicket?.notes
  ],
  async ([visible]) => {
    if (visible) {
      dropoutReason.value = props.appointment?.dropout_reason ?? ""
      encounterNotes.value = props.encounterTicket?.notes ?? ""

      await nextTick()
      initializeSignatureCanvases()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  isSigning.value = false
  isStaffSigning.value = false
})
</script>
