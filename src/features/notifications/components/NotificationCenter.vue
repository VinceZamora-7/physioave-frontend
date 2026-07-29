<template>
  <div>
    <button
      type="button"
      class="app-header-icon-btn notification-trigger relative"
      :class="{ 'has-unread': unreadCount > 0 }"
      :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'"
      title="Notifications"
      @click="toggle"
    >
      <i class="pi pi-bell text-[17px]" />
      <span v-if="unreadCount" class="notification-count absolute -right-1.5 -top-1.5 min-w-5 rounded-full px-1 text-center text-[10px] font-bold leading-5 text-white">
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>

    <Popover ref="popover" @show="loadNotifications">
      <section class="notification-panel w-[min(94vw,430px)]">
        <div class="notification-panel-header">
          <div>
            <div class="flex items-center gap-2">
              <span class="grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-primary-700 shadow-sm">
                <i class="pi pi-bell" />
              </span>
              <div>
                <h3 class="text-base font-bold text-surface-900">Billing notifications</h3>
                <p class="text-xs text-surface-600">HMO and LGU review assignments</p>
              </div>
            </div>
          </div>
          <button type="button" class="notification-refresh" aria-label="Refresh notifications" title="Refresh" @click="loadNotifications">
            <i class="pi pi-refresh" :class="{ 'pi-spin': loading }" />
          </button>
        </div>

        <div class="flex items-center justify-between border-b border-surface-200 px-4 py-2.5">
          <div class="notification-tabs" role="tablist" aria-label="Notification filter">
            <button type="button" :class="{ active: activeFilter === 'all' }" @click="activeFilter = 'all'">All</button>
            <button type="button" :class="{ active: activeFilter === 'unread' }" @click="activeFilter = 'unread'">
              Unread <span v-if="unreadCount">{{ unreadCount }}</span>
            </button>
          </div>
          <button v-if="unreadCount" type="button" class="text-xs font-semibold text-primary-700 hover:text-primary-900" @click="markAllRead">
            Mark all read
          </button>
        </div>

        <div class="notification-list max-h-[460px] overflow-y-auto">
          <div v-if="loading && !notifications.length" class="space-y-3 p-4" aria-label="Loading notifications">
            <div v-for="index in 3" :key="index" class="notification-skeleton">
              <span /><div><span /><span /></div>
            </div>
          </div>
          <div v-else-if="loadError" class="notification-empty">
            <span class="notification-empty-icon text-red-500"><i class="pi pi-exclamation-circle" /></span>
            <strong>Could not load notifications</strong>
            <p>{{ loadError }}</p>
            <Button label="Try again" icon="pi pi-refresh" size="small" outlined @click="loadNotifications" />
          </div>
          <div v-else-if="!visibleNotifications.length" class="notification-empty">
            <span class="notification-empty-icon"><i :class="activeFilter === 'unread' ? 'pi pi-check-circle' : 'pi pi-inbox'" /></span>
            <strong>{{ activeFilter === "unread" ? "You’re all caught up" : "No notifications yet" }}</strong>
            <p>{{ activeFilter === "unread" ? "There are no billing reviews waiting for you." : "Billing review assignments will appear here." }}</p>
          </div>
          <button
            v-for="item in visibleNotifications"
            v-else
            :key="item.id"
            type="button"
            class="notification-item"
            :class="{ unread: !item.read_at }"
            @click="openNotification(item)"
          >
            <div class="flex gap-3.5">
              <span class="notification-item-icon">
                <i :class="item.notification_type === 'EOD_REMINDER' ? 'pi pi-clock' : 'pi pi-wallet'" class="text-sm" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="mb-1 flex flex-wrap items-center gap-1.5">
                  <span v-if="item.metadata?.payer_type" class="payer-chip" :class="item.metadata.payer_type.toLowerCase()">
                    {{ item.metadata.payer_type }}
                  </span>
                  <span v-if="item.metadata?.billing_status" class="status-chip">{{ formatStatus(item.metadata.billing_status) }}</span>
                </span>
                <span class="block text-sm font-bold leading-5 text-surface-900">{{ item.title }}</span>
                <span class="mt-1 block text-sm leading-5 text-surface-600">{{ item.message }}</span>
                <span v-if="item.metadata?.clinic_name" class="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                  <i class="pi pi-map-marker" />{{ item.metadata.clinic_name }}
                </span>
                <span class="mt-2 flex items-center justify-between gap-2 text-[11px] text-surface-400">
                  <span>From {{ item.created_by_name }}</span>
                  <span :title="formatDate(item.created_at)">{{ formatRelativeTime(item.created_at) }}</span>
                </span>
              </span>
              <span v-if="!item.read_at" class="notification-unread-dot" aria-label="Unread" />
            </div>
          </button>
        </div>

        <div v-if="canSend" class="border-t border-surface-200 bg-surface-50 p-3">
          <Button label="Notify billing managers" icon="pi pi-send" fluid @click="openCompose" />
        </div>
      </section>
    </Popover>

    <Dialog v-model:visible="showCompose" modal header="Notify billing managers" :style="{ width: 'min(94vw, 560px)' }">
      <div class="space-y-4">
        <div class="notification-tabs w-fit" role="tablist" aria-label="Notification type">
          <button v-if="canSendReview" type="button" :class="{ active: composeType === 'billing' }" @click="composeType = 'billing'">Billing review</button>
          <button v-if="canSendEod" type="button" :class="{ active: composeType === 'eod' }" @click="composeType = 'eod'">Pending EOD</button>
        </div>
        <p class="text-sm text-surface-600">
          {{ composeType === "billing"
            ? "Choose an HMO or LGU billing that has not been billed yet. Managers assigned to its clinic will be notified."
            : "Choose an unresolved EOD appointment. Its assigned therapist will be notified directly." }}
        </p>
        <div v-if="composeType === 'billing'">
          <label class="mb-1 block text-sm font-medium">Not-billed HMO/LGU record</label>
          <Select
            v-model="selectedBillingId"
            :options="outstandingBillings"
            option-value="id"
            :loading="loadingBillings"
            filter
            placeholder="Select a billing record"
            class="w-full"
          >
            <template #option="{ option }">
              <div class="min-w-0 py-1">
                <div class="font-medium">{{ billingOptionTitle(option) }}</div>
                <div class="text-xs text-surface-500">
                  {{ option.patient_name }} · {{ option.clinic_name || "Unassigned clinic" }} · {{ formatStatus(option.document_status) }}
                </div>
              </div>
            </template>
            <template #value="{ value, placeholder }">
              <span v-if="selectedBilling(value)">
                {{ billingOptionTitle(selectedBilling(value)!) }} — {{ selectedBilling(value)!.clinic_name || "Unassigned clinic" }}
              </span>
              <span v-else>{{ placeholder }}</span>
            </template>
          </Select>
          <p v-if="!loadingBillings && !outstandingBillings.length" class="mt-2 text-xs text-surface-500">
            No not-billed HMO or LGU records were found.
          </p>
        </div>
        <div v-else>
          <div class="mb-2 flex items-end justify-between gap-3">
            <label class="block text-sm font-medium">Pending EOD assignment</label>
            <Select
              v-model="eodDateFilter"
              :options="eodDateFilterOptions"
              option-label="label"
              option-value="value"
              size="small"
              class="w-40"
              aria-label="Filter pending EOD assignments by date"
            />
          </div>
          <MultiSelect
            v-model="selectedEodAppointmentIds"
            :options="filteredEodAssignments"
            option-value="appointment_id"
            :loading="loadingEod"
            filter
            display="chip"
            :max-selected-labels="2"
            selected-items-label="{0} EOD assignments selected"
            placeholder="Select an EOD blocker"
            class="w-full"
          >
            <template #option="{ option }">
              <div class="min-w-0 py-1">
                <div class="font-medium">{{ option.patient_name }} · {{ option.assigned_staff_name || "Unassigned PT" }}</div>
                <div class="text-xs text-surface-500">{{ option.clinic_name }} · {{ option.blockers.join(", ") }}</div>
              </div>
            </template>
          </MultiSelect>
          <div v-if="filteredEodAssignments.length" class="mt-2 flex items-center justify-between">
            <span class="text-xs text-surface-500">{{ selectedEodAppointmentIds.length }} of {{ filteredEodAssignments.length }} selected</span>
            <button
              type="button"
              class="text-xs font-semibold text-primary-700 hover:text-primary-900"
              @click="toggleAllVisibleEod"
            >
              {{ allVisibleEodSelected ? "Clear all" : "Select all" }}
            </button>
          </div>
          <p v-if="!loadingEod && !filteredEodAssignments.length" class="mt-2 text-xs text-surface-500">
            {{ eodDateFilter === "today" ? "All of today’s EOD work is finished." : "No pending EOD assignments were found for this filter." }}
          </p>
        </div>
        <div v-if="composeType === 'billing' && chosenBilling" class="selected-billing-card">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">Selected assignment</p>
              <h4 class="mt-1 font-bold text-surface-900">{{ chosenBilling.patient_name }}</h4>
              <p class="mt-0.5 text-sm text-surface-600">{{ chosenBilling.sponsor_name || chosenBilling.payer_type }}</p>
            </div>
            <span class="payer-chip" :class="chosenBilling.payer_type.toLowerCase()">{{ chosenBilling.payer_type }}</span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span><i class="pi pi-map-marker mr-1 text-primary-600" />{{ chosenBilling.clinic_name || "Unassigned clinic" }}</span>
            <span><i class="pi pi-file mr-1 text-primary-600" />{{ chosenBilling.document_number || `Billing #${chosenBilling.id}` }}</span>
            <span><i class="pi pi-info-circle mr-1 text-primary-600" />{{ formatStatus(chosenBilling.document_status) }}</span>
            <span><i class="pi pi-wallet mr-1 text-primary-600" />Balance {{ formatMoney(chosenBilling.balance_amount) }}</span>
          </div>
        </div>
        <div v-if="composeType === 'eod' && selectedEodAssignments.length" class="selected-billing-card">
          <p class="text-xs font-semibold uppercase tracking-wide text-primary-700">EOD assignment</p>
          <h4 class="mt-1 font-bold text-surface-900">{{ selectedEodAssignments.length }} reminder{{ selectedEodAssignments.length === 1 ? "" : "s" }} ready</h4>
          <div class="mt-2 max-h-36 space-y-2 overflow-y-auto">
            <div v-for="item in selectedEodAssignments" :key="item.appointment_id" class="rounded-lg bg-white/80 p-2 text-xs">
              <div class="font-semibold text-surface-800">{{ item.patient_name }} · {{ item.assigned_staff_name || "Unassigned PT" }}</div>
              <div class="mt-0.5 text-surface-500">{{ item.clinic_name }} · {{ item.blockers.join(", ") }}</div>
            </div>
          </div>
        </div>
        <div>
          <label for="notification-message" class="mb-1 block text-sm font-medium">Message (optional)</label>
          <Textarea id="notification-message" v-model="message" rows="4" maxlength="1000" fluid placeholder="Add details about what needs to be checked..." />
          <p class="mt-1 text-right text-xs text-surface-400">{{ message.length }}/1000</p>
        </div>
        <p v-if="sendError" class="text-sm text-red-600">{{ sendError }}</p>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showCompose = false" />
        <Button label="Send notification" icon="pi pi-send" :loading="sending" :disabled="!canSubmitCompose" @click="sendNotification" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import Button from "primevue/button"
import Dialog from "primevue/dialog"
import Popover from "primevue/popover"
import MultiSelect from "primevue/multiselect"
import Select from "primevue/select"
import Textarea from "primevue/textarea"
import { useToast } from "primevue/usetoast"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import {
  notificationService,
  type OutstandingSponsorBilling,
  type PendingEodAssignment,
  type StaffNotification
} from "@/features/notifications/api/notification.service"

const router = useRouter()
const auth = useAuthSessionStore()
const toast = useToast()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const notifications = ref<StaffNotification[]>([])
const outstandingBillings = ref<OutstandingSponsorBilling[]>([])
const pendingEodAssignments = ref<PendingEodAssignment[]>([])
const selectedBillingId = ref<number | null>(null)
const selectedEodAppointmentIds = ref<number[]>([])
const composeType = ref<"billing" | "eod">("billing")
const eodDateFilter = ref<"today" | "previous" | "all">("today")
const eodDateFilterOptions = [
  { label: "Today", value: "today" },
  { label: "Previous days", value: "previous" },
  { label: "All pending", value: "all" }
]
const unreadCount = ref(0)
const activeFilter = ref<"all" | "unread">("all")
const loading = ref(false)
const loadError = ref("")
const loadingBillings = ref(false)
const loadingEod = ref(false)
const showCompose = ref(false)
const message = ref("")
const sending = ref(false)
const sendError = ref("")
let pollTimer: number | undefined

const canSendReview = computed(() => auth.hasAnyPermission("BillingNotification::SEND_REVIEW"))
const canSendEod = computed(() => auth.hasAnyPermission("BillingNotification::SEND_EOD"))
const canSend = computed(() => canSendReview.value || canSendEod.value)
const visibleNotifications = computed(() =>
  activeFilter.value === "unread" ? notifications.value.filter(item => !item.read_at) : notifications.value
)
const chosenBilling = computed(() => selectedBilling(selectedBillingId.value))
const selectedEodAssignments = computed(() => {
  const selectedIds = new Set(selectedEodAppointmentIds.value)
  return pendingEodAssignments.value.filter(item => selectedIds.has(item.appointment_id))
})
const localDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
const todayDateKey = () => localDateKey(new Date())
const filteredEodAssignments = computed(() => {
  if (eodDateFilter.value === "all") return pendingEodAssignments.value
  const today = todayDateKey()
  return pendingEodAssignments.value.filter(item =>
    eodDateFilter.value === "today"
      ? localDateKey(item.starts_at) === today
      : localDateKey(item.starts_at) < today
  )
})
const allVisibleEodSelected = computed(() =>
  filteredEodAssignments.value.length > 0 &&
  filteredEodAssignments.value.every(item => selectedEodAppointmentIds.value.includes(item.appointment_id))
)
const canSubmitCompose = computed(() =>
  composeType.value === "billing" ? Boolean(selectedBillingId.value) : selectedEodAppointmentIds.value.length > 0
)
const toggle = (event: Event) => popover.value?.toggle(event)

const refreshCount = async () => {
  try { unreadCount.value = await notificationService.unreadCount() } catch { /* handled by auth flow */ }
}
const loadNotifications = async () => {
  loading.value = true
  loadError.value = ""
  try {
    notifications.value = await notificationService.list()
    unreadCount.value = notifications.value.filter(item => !item.read_at).length
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "Please check your connection and try again."
  } finally {
    loading.value = false
  }
}
const openCompose = () => {
  popover.value?.hide()
  sendError.value = ""
  showCompose.value = true
}
const loadOutstandingBillings = async () => {
  if (!canSendReview.value) return
  loadingBillings.value = true
  try {
    outstandingBillings.value = await notificationService.outstandingBillings()
  } finally {
    loadingBillings.value = false
  }
}
const loadPendingEod = async () => {
  if (!canSendEod.value) return
  loadingEod.value = true
  try {
    pendingEodAssignments.value = await notificationService.pendingEod()
  } finally {
    loadingEod.value = false
  }
}
const markAllRead = async () => {
  await notificationService.markAllRead()
  notifications.value = notifications.value.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
  unreadCount.value = 0
}
const openNotification = async (item: StaffNotification) => {
  if (!item.read_at) {
    await notificationService.markRead(item.id)
    item.read_at = new Date().toISOString()
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  popover.value?.hide()
  if (item.action_path) await router.push(item.action_path)
}
const sendNotification = async () => {
  if (!canSubmitCompose.value) return
  sending.value = true
  sendError.value = ""
  try {
    const result = composeType.value === "billing"
      ? await notificationService.sendBillingReview({
          billing_document_id: Number(selectedBillingId.value),
          message: message.value.trim() || undefined
        })
      : {
          recipients: (await Promise.all(selectedEodAppointmentIds.value.map(appointmentId =>
            notificationService.sendEodReminder({
              appointment_id: appointmentId,
              message: message.value.trim() || undefined
            })
          ))).reduce((total, response) => total + response.recipients, 0)
        }
    showCompose.value = false
    message.value = ""
    selectedBillingId.value = null
    selectedEodAppointmentIds.value = []
    toast.add({
      severity: "success",
      summary: "Notification sent",
      detail: composeType.value === "billing"
        ? `Notified ${result.recipients} billing manager(s) assigned to this clinic.`
        : `Sent ${result.recipients} EOD reminder${result.recipients === 1 ? "" : "s"} to assigned therapists.`,
      life: 3500
    })
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : "Unable to send notification"
  } finally {
    sending.value = false
  }
}
const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
const formatRelativeTime = (value: string) => {
  const elapsedSeconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  if (Math.abs(elapsedSeconds) < 60) return formatter.format(elapsedSeconds, "second")
  const minutes = Math.round(elapsedSeconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")
  return formatter.format(Math.round(hours / 24), "day")
}
const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value ?? 0))
const formatStatus = (value: string) =>
  String(value || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter: string) => letter.toUpperCase())
const selectedBilling = (id: unknown) => outstandingBillings.value.find(item => item.id === Number(id))
const billingOptionTitle = (item: OutstandingSponsorBilling) =>
  `${item.payer_type} · ${item.document_number || `Billing #${item.id}`}${item.sponsor_name ? ` · ${item.sponsor_name}` : ""}`

watch(showCompose, visible => {
  if (visible) {
    composeType.value = canSendReview.value ? "billing" : "eod"
    void Promise.all([loadOutstandingBillings(), loadPendingEod()])
  }
})
watch(eodDateFilter, () => {
  const visibleIds = new Set(filteredEodAssignments.value.map(item => item.appointment_id))
  selectedEodAppointmentIds.value = selectedEodAppointmentIds.value.filter(id => visibleIds.has(id))
})
const toggleAllVisibleEod = () => {
  const visibleIds = filteredEodAssignments.value.map(item => item.appointment_id)
  if (allVisibleEodSelected.value) {
    const visibleSet = new Set(visibleIds)
    selectedEodAppointmentIds.value = selectedEodAppointmentIds.value.filter(id => !visibleSet.has(id))
    return
  }
  selectedEodAppointmentIds.value = [...new Set([...selectedEodAppointmentIds.value, ...visibleIds])]
}
onMounted(() => {
  void refreshCount()
  pollTimer = window.setInterval(() => void refreshCount(), 30_000)
})
onUnmounted(() => {
  if (pollTimer !== undefined) window.clearInterval(pollTimer)
})
</script>

<style scoped>
.notification-trigger.has-unread {
  color: #a21caf;
  background: linear-gradient(145deg, #fff, #fdf4ff);
}
.notification-count {
  background: linear-gradient(135deg, #e11d48, #be123c);
  box-shadow: 0 0 0 2px white, 0 2px 6px rgba(190, 18, 60, .35);
}
.notification-panel {
  margin: -12px;
  overflow: hidden;
  border-radius: 14px;
  color: var(--p-surface-900);
  background: #ffffff;
  box-shadow: 0 18px 45px rgba(46, 16, 101, .18);
}
.notification-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%);
  border-bottom: 1px solid rgba(147, 51, 234, .12);
}
.notification-refresh {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  color: #7e22ce;
}
.notification-refresh:hover { background: rgba(126, 34, 206, .08); }
.notification-tabs {
  display: flex;
  gap: 3px;
  padding: 3px;
  border-radius: 9px;
  background: var(--p-surface-100);
}
.notification-tabs button {
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 650;
  color: var(--p-surface-500);
}
.notification-tabs button.active {
  color: #7e22ce;
  background: white;
  box-shadow: 0 1px 3px rgba(15, 23, 42, .1);
}
.notification-tabs span {
  margin-left: 3px;
  border-radius: 999px;
  padding: 1px 5px;
  color: white;
  background: #a21caf;
}
.notification-item {
  position: relative;
  display: block;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--p-surface-100);
  transition: background .15s ease, transform .15s ease;
  background: #ffffff;
}
.notification-item:hover { background: var(--p-surface-50); }
.notification-item.unread {
  background: linear-gradient(90deg, #fae8ff, #ffffff);
}
.notification-item.unread::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  content: "";
  background: linear-gradient(#a21caf, #7e22ce);
}
.notification-item-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  border-radius: 11px;
  color: #7e22ce;
  background: #f3e8ff;
}
.notification-unread-dot {
  width: 8px;
  height: 8px;
  margin-top: 8px;
  flex: none;
  border-radius: 999px;
  background: #a21caf;
  box-shadow: 0 0 0 3px #fae8ff;
}
.payer-chip, .status-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .04em;
}
.payer-chip.hmo { color: #1d4ed8; background: #dbeafe; }
.payer-chip.lgu { color: #047857; background: #d1fae5; }
.status-chip { color: #92400e; background: #fef3c7; }
.notification-empty {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.notification-empty-icon {
  display: grid;
  width: 46px;
  height: 46px;
  margin-bottom: 10px;
  place-items: center;
  border-radius: 14px;
  font-size: 20px;
  color: #7e22ce;
  background: #f3e8ff;
}
.notification-empty strong { color: var(--p-surface-800); }
.notification-empty p { max-width: 280px; margin: 4px 0 14px; font-size: 12px; color: var(--p-surface-500); }
.notification-skeleton { display: flex; gap: 12px; padding: 8px 0; }
.notification-skeleton > span { width: 36px; height: 36px; flex: none; border-radius: 11px; background: var(--p-surface-200); }
.notification-skeleton div { display: flex; flex: 1; flex-direction: column; gap: 8px; }
.notification-skeleton div span { height: 11px; border-radius: 999px; background: var(--p-surface-200); }
.notification-skeleton div span:last-child { width: 70%; }
.notification-skeleton span { animation: pulse 1.4s ease-in-out infinite; }
.selected-billing-card {
  padding: 14px;
  border: 1px solid rgba(126, 34, 206, .18);
  border-radius: 12px;
  background: linear-gradient(135deg, #fdf4ff, #faf5ff);
}
@keyframes pulse { 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) {
  .notification-skeleton span, .pi-spin { animation: none !important; }
}
</style>
