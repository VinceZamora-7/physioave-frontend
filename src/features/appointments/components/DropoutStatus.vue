<template>
  <section
    v-if="selectedDetail"
    :class="[
      'rounded-2xl border p-4',
      dropoutStatusValue === 'DROPPED_OUT'
        ? 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100'
        : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))]'
    ]"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <Tag :value="dropoutStatusLabel" :severity="dropoutStatusSeverity" />
          <span class="text-sm font-semibold">Dropout Status</span>
          <span
            v-if="selectedDetail.public_id"
            class="text-xs opacity-65"
          >
            {{ selectedDetail.public_id }}
          </span>
        </div>

        <p class="m-0 mt-2 text-xs leading-5 opacity-75">
          {{ dropoutStatusDescription }}
        </p>

        <div
          v-if="dropoutStatusValue === 'DROPPED_OUT'"
          class="mt-3 grid gap-2 text-xs sm:grid-cols-2"
        >
          <div class="rounded-xl border border-rose-200 bg-white/70 px-3 py-2 dark:border-rose-500/20 dark:bg-white/5">
            <div class="font-semibold">Billing Locked</div>
            <div class="mt-1 opacity-75">Billing and month-end claims should stay blocked until this patient is returned.</div>
          </div>
          <div class="rounded-xl border border-rose-200 bg-white/70 px-3 py-2 dark:border-rose-500/20 dark:bg-white/5">
            <div class="font-semibold">Dropout Claim</div>
            <div class="mt-1 opacity-75">Consumed LGU credits are handled through the dropout conversion flow.</div>
          </div>
        </div>

        <div
          v-else-if="dropoutStatusValue === 'RETURNED'"
          class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100"
        >
          Patient has returned after a previous dropout. Review billing before creating new LGU claims.
        </div>
      </div>

      <Button
        :label="dropoutToggleLabel"
        :icon="dropoutToggleIcon"
        :severity="dropoutToggleSeverity"
        :loading="dropoutLoading"
        size="small"
        outlined
        @click="openDropoutDialog"
      />
    </div>

    <Dialog
      v-model:visible="dropoutDialogVisible"
      modal
      :draggable="false"
      :style="{ width: 'min(520px, 94vw)' }"
      :header="dropoutDialogHeader"
    >
      <div class="space-y-4">
        <Message
          :severity="nextDropoutStatus === 'DROPPED_OUT' ? 'warn' : 'info'"
          :closable="false"
        >
          {{ dropoutDialogMessage }}
        </Message>

        <div v-if="nextDropoutStatus === 'DROPPED_OUT'">
          <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-[rgb(var(--app-fg))]/55">
            Dropout Reason
          </label>
          <Textarea
            v-model="dropoutReason"
            autoResize
            fluid
            rows="4"
            placeholder="Document why this patient is being marked as dropped out..."
          />
          <small class="mt-1 block text-xs text-[rgb(var(--app-fg))]/60">
            Required for local audit context. The status update will also trigger the LGU dropout conversion flow.
          </small>
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          text
          severity="secondary"
          @click="dropoutDialogVisible = false"
        />
        <Button
          :label="confirmDropoutLabel"
          :icon="dropoutToggleIcon"
          :severity="dropoutToggleSeverity"
          :loading="dropoutLoading"
          :disabled="nextDropoutStatus === 'DROPPED_OUT' && !dropoutReason.trim()"
          @click="confirmDropoutStatus"
        />
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from "vue"
import { useToast } from "primevue/usetoast"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Message from "primevue/message"
import Tag from "primevue/tag"
import Textarea from "primevue/textarea"
import type { AppointmentDetail } from "@/features/appointments/api/appointment-phase1.service"
import { useDropoutStatus } from "@/features/appointments/composables/useDropoutStatus"

const props = defineProps<{
  selectedDetail?: AppointmentDetail
}>()

const emit = defineEmits<{
  updated: [detail: AppointmentDetail]
}>()

const toast = useToast()
const selectedDetailRef = toRef(props, "selectedDetail")
const dropoutDialogVisible = ref(false)
const dropoutReason = ref("")

const {
  dropoutLoading,
  dropoutStatusValue,
  dropoutStatusLabel,
  dropoutStatusSeverity,
  dropoutToggleLabel,
  dropoutToggleIcon,
  dropoutToggleSeverity,
  dropoutStatusDescription,
  updateDropoutStatus
} = useDropoutStatus(selectedDetailRef, toast, detail => emit("updated", detail))

const nextDropoutStatus = computed(() =>
  dropoutStatusValue.value === "DROPPED_OUT" ? "RETURNED" : "DROPPED_OUT"
)

const dropoutDialogHeader = computed(() =>
  nextDropoutStatus.value === "DROPPED_OUT" ? "Mark Patient as Dropped Out" : "Mark Patient as Returned"
)

const dropoutDialogMessage = computed(() =>
  nextDropoutStatus.value === "DROPPED_OUT"
    ? "This will mark the appointment as dropped out and create/route consumed LGU credits through the dropout claim flow."
    : "This will mark the patient as returned so future LGU billing actions can be reviewed normally."
)

const confirmDropoutLabel = computed(() =>
  nextDropoutStatus.value === "DROPPED_OUT" ? "Confirm Drop-out" : "Confirm Return"
)

const openDropoutDialog = (): void => {
  dropoutReason.value = ""
  dropoutDialogVisible.value = true
}

const confirmDropoutStatus = async (): Promise<void> => {
  if (nextDropoutStatus.value === "DROPPED_OUT" && !dropoutReason.value.trim()) return
  await updateDropoutStatus(nextDropoutStatus.value, dropoutReason.value)
  dropoutDialogVisible.value = false
}
</script>
