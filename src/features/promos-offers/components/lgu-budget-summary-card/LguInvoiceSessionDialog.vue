<template>
  <Dialog v-model:visible="visibleModel" header="Select Session Invoice" modal :style="{ width: 'min(92vw, 760px)' }">
    <div class="space-y-3">
      <Message v-if="!invoiceSessionOptions.length" severity="secondary" :closable="false" size="small">
        No LGU sessions are available for this patient yet.
      </Message>

      <div v-else class="overflow-x-auto rounded-2xl border border-[rgb(var(--app-border))]">
        <table class="min-w-full text-sm">
          <thead class="bg-[rgb(var(--app-bg-soft))] text-left text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/60">
            <tr>
              <th class="px-3 py-2 font-bold">Session</th>
              <th class="px-3 py-2 font-bold">Date</th>
              <th class="px-3 py-2 font-bold">Package / Service</th>
              <th class="px-3 py-2 font-bold">Claim</th>
              <th class="px-3 py-2 font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="option in invoiceSessionOptions" :key="option.key" class="border-t border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))]">
              <td class="px-3 py-2 font-bold">{{ option.label }}</td>
              <td class="px-3 py-2 text-xs text-[rgb(var(--app-fg))]/70">{{ formatDateTime(option.appointmentDate) }}</td>
              <td class="px-3 py-2 text-xs">
                <div class="font-medium text-[rgb(var(--app-fg))]">{{ option.packageName }}</div>
                <div class="text-[rgb(var(--app-fg))]/60">{{ option.serviceName }}</div>
              </td>
              <td class="px-3 py-2">
                <Tag :value="option.claimLabel" :severity="option.billingId ? 'success' : 'secondary'" class="text-xs" />
              </td>
              <td class="px-3 py-2">
                <Button label="Print" icon="pi pi-print" size="small" outlined :disabled="!option.billingId" :loading="printingClaimBillingId === option.billingId" @click="$emit('print-session-invoice', option)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <Button label="Close" text @click="visibleModel = false" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Message from "primevue/message"
import Tag from "primevue/tag"
import type { LguInvoiceSessionOption } from "./types"

defineProps<{
  invoiceSessionOptions: LguInvoiceSessionOption[]
  printingClaimBillingId: number | null
  formatDateTime: (value?: string) => string
}>()

const visibleModel = defineModel<boolean>("visible", { required: true })

defineEmits<{
  "print-session-invoice": [option: LguInvoiceSessionOption]
}>()
</script>
